/**
 * Capture visible viewport screenshot from current active tab
 * Returns base64 encoded image data
 * Uses background service worker to capture the screenshot
 */
export async function capturePageScreenshot(): Promise<string | null> {
    try {
        console.log('[capturePageScreenshot] Requesting screenshot from background...');

        // Send message to background script with timeout handling
        // Wrap in a Promise with timeout to prevent hanging
        const timeoutMs = 10000; // 10 seconds timeout

        const messagePromise = chrome.runtime.sendMessage({
            type: "CAPTURE_SCREENSHOT"
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error('Screenshot capture timed out after 10 seconds'));
            }, timeoutMs);
        });

        // Race between message response and timeout
        const response = await Promise.race([messagePromise, timeoutPromise]);

        console.log('[capturePageScreenshot] Response from background:', response);

        if (response && response.success) {
            console.log('[capturePageScreenshot] Screenshot captured successfully, length:', response.screenshot?.length);
            return response.screenshot;
        } else {
            const errorMsg = response?.error || 'Unknown error';
            console.error('[capturePageScreenshot] Failed to capture screenshot:', errorMsg);
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error('[capturePageScreenshot] Error requesting screenshot:', error);
        console.error('[capturePageScreenshot] Error details:', error?.message, error?.stack);

        // Provide user-friendly error message
        const errorMessage = error?.message || 'Unknown error';
        if (errorMessage.includes('timed out')) {
            throw new Error('Screenshot capture timed out. The page might be too large or complex.');
        } else if (errorMessage.includes('message channel closed')) {
            throw new Error('Connection lost while capturing screenshot. Please try again.');
        } else {
            throw error;
        }
    }
}

/**
 * Get selected text from current active tab
 * If no text is selected, returns the page title and main content
 */
export async function getTabSelection(): Promise<string | null> {
    try {
        console.log('[getTabSelection] Starting...');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('[getTabSelection] Active tab:', tab?.id, tab?.url);

        if (!tab.id) {
            console.error('[getTabSelection] No active tab found');
            return null;
        }

        console.log('[getTabSelection] Executing script on tab:', tab.id);
        // Inject script to get selected text or page content
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                console.log('[Injected Script] Running in page context');
                const selection = window.getSelection();
                const selectedText = selection?.toString().trim();

                console.log('[Injected Script] Selected text:', selectedText ? `${selectedText.length} chars` : 'none');

                // If there's selected text, return it
                if (selectedText) {
                    return selectedText;
                }

                // Otherwise, get page title and visible content
                const title = document.title;
                console.log('[Injected Script] Page title:', title);

                // Try to get main content from common content areas
                let mainContent = '';
                const contentSelectors = [
                    'article',
                    'main',
                    '[role="main"]',
                    '.content',
                    '.main-content',
                    '#content',
                    '#main'
                ];

                for (const selector of contentSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        mainContent = element.innerText;
                        console.log('[Injected Script] Found content with selector:', selector, mainContent.length, 'chars');
                        break;
                    }
                }

                // If no main content found, get body text (limited to first 3000 chars)
                if (!mainContent) {
                    mainContent = document.body.innerText.substring(0, 3000);
                    console.log('[Injected Script] Using body text:', mainContent.length, 'chars');
                }

                const result = `Page: ${title}\n\n${mainContent}`;
                console.log('[Injected Script] Returning:', result.length, 'chars');
                return result;
            }
        });

        console.log('[getTabSelection] Script execution results:', results);

        if (results && results[0] && results[0].result) {
            console.log('[getTabSelection] Success! Result length:', results[0].result.length);
            return results[0].result as string;
        }

        console.warn('[getTabSelection] No result from script execution');
        return null;
    } catch (error) {
        console.error('[getTabSelection] Error getting selection:', error);
        console.error('[getTabSelection] Error details:', error.message, error.stack);
        return null;
    }
}
