/**
 * Get selected text from current active tab
 * If no text is selected, returns the page title and main content
 */
export async function getTabSelection(): Promise<string | null> {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.id) {
            console.error('[getTabSelection] No active tab found');
            return null;
        }

        // Inject script to get selected text or page content
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const selection = window.getSelection();
                const selectedText = selection?.toString().trim();

                // If there's selected text, return it
                if (selectedText) {
                    return selectedText;
                }

                // Otherwise, get page title and visible content
                const title = document.title;

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
                        break;
                    }
                }

                // If no main content found, get body text (limited to first 3000 chars)
                if (!mainContent) {
                    mainContent = document.body.innerText.substring(0, 3000);
                }

                return `Page: ${title}\n\n${mainContent}`;
            }
        });

        if (results && results[0] && results[0].result) {
            return results[0].result as string;
        }

        return null;
    } catch (error) {
        console.error('[getTabSelection] Error getting selection:', error);
        return null;
    }
}
