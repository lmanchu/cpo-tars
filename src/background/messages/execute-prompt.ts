import type { PlasmoMessaging } from "@plasmohq/messaging";

export interface ExecutePromptRequest {
    prompt: string;
    promptTitle: string;
    selectedText: string;
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const { prompt, promptTitle, selectedText } = req.body as ExecutePromptRequest;

    console.log("[execute-prompt] Received request:", { promptTitle, textLength: selectedText.length });

    // Store the prompt execution request so sidepanel can pick it up
    await chrome.storage.local.set({
        pendingPromptExecution: {
            prompt,
            promptTitle,
            selectedText,
            timestamp: Date.now()
        }
    });

    // Notify sidepanel via chrome.runtime.sendMessage
    try {
        await chrome.runtime.sendMessage({
            type: "EXECUTE_PROMPT",
            payload: {
                prompt,
                promptTitle,
                selectedText
            }
        });
    } catch (error) {
        console.log("[execute-prompt] Sidepanel not ready yet, will be picked up when opened");
    }

    res.send({ success: true });
};

export default handler;
