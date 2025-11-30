// Background service worker for screenshot capture and sidepanel management

// Handle extension icon click - directly open sidepanel
chrome.action.onClicked.addListener(async (tab) => {
    console.log('[Background] Extension icon clicked, opening sidepanel...');
    try {
        // Get the window ID from the tab
        const windowId = tab.windowId;
        if (windowId) {
            await chrome.sidePanel.open({ windowId });
            console.log('[Background] Sidepanel opened successfully');
        }
    } catch (error) {
        console.error('[Background] Error opening sidepanel on icon click:', error);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Background] Received message:', message.type);

    if (message.type === "CAPTURE_SCREENSHOT") {
        // Wrap in IIFE to properly handle async response
        (async () => {
            try {
                await handleScreenshotCapture(sendResponse);
            } catch (error) {
                console.error('[Background] Fatal error in handleScreenshotCapture:', error);
                sendResponse({ success: false, error: 'Fatal error occurred' });
            }
        })();
        return true; // Keep the message channel open for async response
    }

    if (message.type === "OPEN_SIDE_PANEL") {
        // Wrap in IIFE to properly handle async response
        (async () => {
            try {
                await handleOpenSidePanel(sendResponse);
            } catch (error) {
                console.error('[Background] Fatal error in handleOpenSidePanel:', error);
                sendResponse({ success: false, error: 'Fatal error occurred' });
            }
        })();
        return true; // Keep the message channel open for async response
    }

    if (message.type === "EXECUTE_PROMPT") {
        // Handle prompt execution from MacrosTab
        // The execution data is already stored in chrome.storage.local by MacrosTab
        // This handler just acknowledges the message
        console.log('[Background] EXECUTE_PROMPT message received, prompt stored in chrome.storage.local');
        sendResponse({ success: true });
        return false; // Synchronous response
    }

    return false;
});

async function handleScreenshotCapture(sendResponse: (response: any) => void) {
    let debuggerAttached = false;
    let responseSent = false;

    const safeSendResponse = (response: any) => {
        if (!responseSent) {
            responseSent = true;
            console.log('[Background] Sending response:', { success: response.success, hasScreenshot: !!response.screenshot, error: response.error });
            try {
                sendResponse(response);
                console.log('[Background] ✓ Response sent successfully');
            } catch (err) {
                console.error('[Background] ✗ Failed to send response:', err);
            }
        } else {
            console.warn('[Background] Response already sent, skipping duplicate sendResponse');
        }
    };

    try {
        console.log('[Background] Starting full-page screenshot capture...');

        // Get the active tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];

        if (!activeTab || !activeTab.id) {
            console.error('[Background] No active tab found');
            safeSendResponse({ success: false, error: 'No active tab found' });
            return;
        }

        console.log('[Background] Active tab:', activeTab.id, activeTab.url);

        // Check if the tab URL is a restricted page
        const url = activeTab.url || '';
        const isRestrictedPage =
            url.startsWith('chrome://') ||
            url.startsWith('chrome-extension://') ||
            url.startsWith('edge://') ||
            url.startsWith('about:') ||
            url.includes('chrome.google.com/webstore');

        if (isRestrictedPage) {
            const errorMsg = `Cannot capture screenshot of restricted page: ${url}. Please navigate to a regular webpage (http:// or https://).`;
            console.error('[Background]', errorMsg);
            safeSendResponse({ success: false, error: errorMsg });
            return;
        }

        const tabId = activeTab.id;

        try {
            // Attach debugger to the tab
            console.log('[Background] Attaching debugger to tab', tabId, '...');
            await chrome.debugger.attach({ tabId }, '1.3');
            debuggerAttached = true;
            console.log('[Background] ✓ Debugger attached successfully');

            // Capture full-page screenshot using Chrome DevTools Protocol
            console.log('[Background] Capturing full-page screenshot via CDP...');
            const result = await chrome.debugger.sendCommand(
                { tabId },
                'Page.captureScreenshot',
                {
                    format: 'png',
                    captureBeyondViewport: true
                }
            );

            const screenshotSize = result.data?.length || 0;
            console.log('[Background] ✓ Full-page screenshot captured successfully');
            console.log('[Background]   Screenshot size:', screenshotSize, 'chars', '~', Math.round(screenshotSize / 1024), 'KB');

            // Detach debugger
            await chrome.debugger.detach({ tabId });
            debuggerAttached = false;
            console.log('[Background] ✓ Debugger detached');

            // Return base64 data (CDP returns it directly without data URL prefix)
            console.log('[Background] Preparing to send response with screenshot data...');
            safeSendResponse({ success: true, screenshot: result.data });
        } catch (debuggerError: any) {
            console.error('[Background] Debugger error:', debuggerError);
            console.error('[Background] Error message:', debuggerError?.message);
            console.error('[Background] Error stack:', debuggerError?.stack);

            // Try to detach if still attached
            if (debuggerAttached) {
                try {
                    await chrome.debugger.detach({ tabId });
                    console.log('[Background] Debugger detached after error');
                } catch (detachError) {
                    console.error('[Background] Failed to detach debugger:', detachError);
                }
            }

            // Provide helpful error message
            let errorMsg = debuggerError?.message || 'Unknown debugger error';
            if (errorMsg.includes('Another debugger is already attached')) {
                errorMsg = 'Another debugger is already attached to this tab. Please close DevTools or other debugging sessions.';
            } else if (errorMsg.includes('Cannot access')) {
                errorMsg = 'Cannot access this page. It may be a restricted page or extension page.';
            }

            throw new Error(errorMsg);
        }
    } catch (error: any) {
        console.error('[Background] Error capturing screenshot:', error);
        console.error('[Background] Error message:', error?.message);
        safeSendResponse({ success: false, error: error?.message || 'Unknown error occurred' });
    }
}

async function handleOpenSidePanel(sendResponse: (response: any) => void) {
    try {
        console.log('[Background] Opening side panel...');

        // Get the current window
        const windows = await chrome.windows.getCurrent();

        if (!windows || !windows.id) {
            console.error('[Background] No current window found');
            sendResponse({ success: false, error: 'No current window found' });
            return;
        }

        console.log('[Background] Current window:', windows.id);

        // Open the side panel
        await chrome.sidePanel.open({ windowId: windows.id });

        console.log('[Background] Side panel opened successfully');
        sendResponse({ success: true });
    } catch (error) {
        console.error('[Background] Error opening side panel:', error);
        sendResponse({ success: false, error: error.message });
    }
}

export {};
