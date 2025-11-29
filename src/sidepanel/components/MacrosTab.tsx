import React, { useState } from 'react';
import { TEXT_PROMPTS, fillPromptTemplate } from '~utils/prompts';
import { getTabSelection } from '~utils/tab-selection';
import { Storage } from "@plasmohq/storage";

export const MacrosTab = () => {
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const storage = new Storage();

    const handlePromptClick = async (promptId: string) => {
        setIsProcessing(promptId);

        try {
            // Get selected text or page content from current tab
            const selectedText = await getTabSelection();

            if (!selectedText) {
                alert('Unable to get content from the page.');
                setIsProcessing(null);
                return;
            }

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

            // Store execution request and send message
            await chrome.storage.local.set({
                pendingPromptExecution: {
                    prompt: filledPrompt,
                    promptTitle: prompt.title,
                    selectedText: selectedText,
                    timestamp: Date.now()
                }
            });

            // Send message to trigger execution
            await chrome.runtime.sendMessage({
                type: "EXECUTE_PROMPT",
                payload: {
                    prompt: filledPrompt,
                    promptTitle: prompt.title,
                    selectedText: selectedText
                }
            });

            // Switch to Chat tab
            // We'll emit an event that App.tsx can listen to
            window.dispatchEvent(new CustomEvent('switch-to-chat'));

        } catch (error) {
            console.error('[MacrosTab] Error executing prompt:', error);
            alert('Failed to execute prompt. Please try again.');
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="font-bold mb-2 text-gray-700">Quick Actions</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Click an action below to process selected text or the entire page content.
                </p>

                <div className="space-y-3">
                    {TEXT_PROMPTS.filter(p => p.id !== 'ask-ai').map(prompt => (
                        <button
                            key={prompt.id}
                            onClick={() => handlePromptClick(prompt.id)}
                            disabled={isProcessing === prompt.id}
                            className="w-full border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
                        >
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">
                                    {prompt.id === 'summarize' && '📝'}
                                    {prompt.id === 'explain' && '💡'}
                                    {prompt.id === 'rephrase' && '✍️'}
                                    {prompt.id === 'grammar' && '✅'}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800 mb-1">
                                        {prompt.title}
                                        {isProcessing === prompt.id && ' (Processing...)'}
                                    </h4>
                                    <p className="text-sm text-gray-600">{prompt.description}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="font-bold mb-2 text-gray-700">How to Use</h3>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                    <li>Option 1: Select text on a webpage, then click any action above or use the floating toolbar</li>
                    <li>Option 2: Without selecting text, click any action to process the entire page content</li>
                    <li>The result will appear in the Chat tab</li>
                </ol>
            </div>

            <div className="bg-blue-50 p-4 rounded shadow-sm border border-blue-200">
                <h3 className="font-bold mb-2 text-blue-800">💡 Pro Tip</h3>
                <p className="text-sm text-blue-700">
                    You can change the target language in the Settings tab. All prompts will respond in your preferred language!
                </p>
            </div>
        </div>
    );
};
