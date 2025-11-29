/**
 * Get selected text from current active tab
 */
export async function getTabSelection(): Promise<string | null> {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.id) {
            console.error('[getTabSelection] No active tab found');
            return null;
        }

        // Inject script to get selected text from the page
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const selection = window.getSelection();
                return selection?.toString().trim() || null;
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
