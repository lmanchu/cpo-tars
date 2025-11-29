import type { PlasmoMessaging } from "@plasmohq/messaging";

export interface ExecutePromptRequest {
    prompt: string;
    promptTitle: string;
    selectedText: string;
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const { prompt, promptTitle, selectedText } = req.body as ExecutePromptRequest;

    console.log("[execute-prompt] Received request:", { promptTitle, textLength: selectedText.length });

    // Open sidepanel first
    try {
        const windows = await chrome.windows.getCurrent();
        await chrome.sidePanel.open({ windowId: windows.id });
        console.log("[execute-prompt] Sidepanel opened");
    } catch (error) {
        console.error("[execute-prompt] Error opening sidepanel:", error);
    }

    // Store the prompt execution request so sidepanel can pick it up
    await chrome.storage.local.set({
        pendingPromptExecution: {
            prompt,
            promptTitle,
            selectedText,
            timestamp: Date.now()
        }
    });

    // Wait a bit for sidepanel to initialize, then send message
    setTimeout(async () => {
        try {
            await chrome.runtime.sendMessage({
                type: "EXECUTE_PROMPT",
                payload: {
                    prompt,
                    promptTitle,
                    selectedText
                }
            });
            console.log("[execute-prompt] Message sent to sidepanel");
        } catch (error) {
            console.log("[execute-prompt] Sidepanel not ready yet, will be picked up when opened");
        }
    }, 500);

    res.send({ success: true });
};

export default handler;
