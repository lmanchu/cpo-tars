import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { TEXT_PROMPTS, fillPromptTemplate } from "~utils/prompts";
import { sendToBackground } from "@plasmohq/messaging";
import { Storage } from "@plasmohq/storage";

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"],
    all_frames: false
};

// Toolbar component
function PromptToolbar() {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [selectedText, setSelectedText] = useState("");
    const storage = new Storage();

    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection();
            const text = selection?.toString().trim();

            if (text && text.length > 0) {
                const range = selection!.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                setSelectedText(text);
                setPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.top + window.scrollY - 50
                });
                setVisible(true);
            } else {
                setVisible(false);
            }
        };

        document.addEventListener("mouseup", handleSelection);
        document.addEventListener("selectionchange", handleSelection);

        return () => {
            document.removeEventListener("mouseup", handleSelection);
            document.removeEventListener("selectionchange", handleSelection);
        };
    }, []);

    const handlePromptClick = async (promptId: string) => {
        const prompt = TEXT_PROMPTS.find(p => p.id === promptId);
        if (!prompt) return;

        // Get target language from settings
        const userSettings = await storage.get<any>('userSettings');
        const targetLanguage = userSettings?.targetLanguage || 'en';
        const languageMap: Record<string, string> = {
            'en': 'English',
            'zh-TW': 'Traditional Chinese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'es': 'Spanish',
            'fr': 'French'
        };

        // Fill template
        const filledPrompt = fillPromptTemplate(
            prompt.template,
            selectedText,
            languageMap[targetLanguage] || 'English'
        );

        // Send message to background to open sidepanel and execute prompt
        try {
            await sendToBackground({
                name: "execute-prompt",
                body: {
                    prompt: filledPrompt,
                    promptTitle: prompt.title,
                    selectedText: selectedText
                }
            });

            setVisible(false);
        } catch (error) {
            console.error("[PromptToolbar] Error sending prompt:", error);
        }
    };

    if (!visible) return null;

    return (
        <div
            style={{
                position: "absolute",
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: "translateX(-50%)",
                zIndex: 2147483647,
                background: "white",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                padding: "8px",
                display: "flex",
                gap: "4px",
                animation: "fadeIn 0.2s ease-in-out"
            }}
        >
            {TEXT_PROMPTS.filter(p => p.id !== 'ask-ai').map(prompt => (
                <button
                    key={prompt.id}
                    onClick={() => handlePromptClick(prompt.id)}
                    title={prompt.title}
                    style={{
                        width: "36px",
                        height: "36px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                    }}
                >
                    <span style={{ fontSize: "20px" }}>
                        {prompt.id === 'summarize' && '📝'}
                        {prompt.id === 'explain' && '💡'}
                        {prompt.id === 'rephrase' && '✍️'}
                        {prompt.id === 'grammar' && '✅'}
                    </span>
                </button>
            ))}
        </div>
    );
}

// Inject styles
const style = document.createElement("style");
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Mount component
const container = document.createElement("div");
container.id = "cpo-tars-prompt-toolbar";
document.body.appendChild(container);

const root = createRoot(container);
root.render(<PromptToolbar />);

export default PromptToolbar;
