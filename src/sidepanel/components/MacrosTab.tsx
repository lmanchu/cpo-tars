import React, { useState } from 'react';
import { TEXT_PROMPTS, VISION_PROMPTS, fillPromptTemplate, requiresVision } from '~utils/prompts';
import { getTabSelection } from '~utils/tab-selection';
import { getEnhancedPageContext, buildVisionPrompt, type PageContext } from '~utils/enhanced-observation';
import { Storage } from "@plasmohq/storage";

export const MacrosTab = () => {
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const storage = new Storage();

    const handlePromptClick = async (promptId: string) => {
        setIsProcessing(promptId);

        try {
            // Find the prompt (from both TEXT_PROMPTS and VISION_PROMPTS)
            const allPrompts = [...TEXT_PROMPTS, ...VISION_PROMPTS];
            const prompt = allPrompts.find(p => p.id === promptId);
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
            const targetLangName = languageMap[targetLanguage] || 'English';

            // Get enhanced page context (智能檢測視覺內容)
            const forceVision = requiresVision(promptId);
            const pageContext = await getEnhancedPageContext(forceVision, true);

            let filledPrompt: string;
            let selectedText: string;

            if (pageContext.type === 'vision') {
                // Vision mode: Build vision-enhanced prompt
                console.log('[MacrosTab] Using VISION mode for prompt:', promptId);

                const basePrompt = fillPromptTemplate(
                    prompt.template,
                    '', // Will be filled in buildVisionPrompt
                    targetLangName
                );

                filledPrompt = buildVisionPrompt(
                    basePrompt,
                    pageContext,
                    targetLangName
                );

                // For storage, use extracted text
                selectedText = pageContext.dom?.elements?.map(el => el.text).join(' ') || 'Page content (with visuals)';

            } else {
                // Text mode: Use traditional approach
                console.log('[MacrosTab] Using TEXT mode for prompt:', promptId);

                if (!pageContext.text) {
                    alert('Unable to get content from the page.');
                    setIsProcessing(null);
                    return;
                }

                filledPrompt = fillPromptTemplate(
                    prompt.template,
                    pageContext.text,
                    targetLangName
                );

                selectedText = pageContext.text;
            }

            // Store execution request with page context
            await chrome.storage.local.set({
                pendingPromptExecution: {
                    prompt: filledPrompt,
                    promptTitle: prompt.title,
                    selectedText: selectedText,
                    pageContext: pageContext,  // Include full context (may contain screenshot)
                    timestamp: Date.now()
                }
            });

            // Send message to trigger execution
            await chrome.runtime.sendMessage({
                type: "EXECUTE_PROMPT",
                payload: {
                    prompt: filledPrompt,
                    promptTitle: prompt.title,
                    selectedText: selectedText,
                    pageContext: pageContext
                }
            });

            // Switch to Chat tab
            window.dispatchEvent(new CustomEvent('switch-to-chat'));

        } catch (error) {
            console.error('[MacrosTab] Error executing prompt:', error);
            alert(`Failed to execute prompt: ${error.message}`);
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Standard Text Macros */}
            <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="font-bold mb-2 text-gray-700">Quick Actions</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Click an action below to process selected text or the entire page content.
                    Actions automatically use vision analysis when the page contains images or charts.
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
                                    <div className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                                        👁️ Vision-enhanced when page has visuals
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Vision-Specific Macros */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded shadow-sm border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">👁️</span>
                    <h3 className="font-bold text-gray-700">Vision Analysis</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    These actions always use vision analysis to understand images, charts, and diagrams.
                </p>

                <div className="space-y-3">
                    {VISION_PROMPTS.map(prompt => (
                        <button
                            key={prompt.id}
                            onClick={() => handlePromptClick(prompt.id)}
                            disabled={isProcessing === prompt.id}
                            className="w-full border border-purple-200 rounded-lg p-4 hover:border-purple-500 hover:bg-purple-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left bg-white"
                        >
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">
                                    {prompt.id === 'vision-summarize' && '📝'}
                                    {prompt.id === 'describe-visuals' && '🖼️'}
                                    {prompt.id === 'extract-chart-data' && '📊'}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800 mb-1">
                                        {prompt.title}
                                        {isProcessing === prompt.id && ' (Processing...)'}
                                    </h4>
                                    <p className="text-sm text-gray-600">{prompt.description}</p>
                                    <div className="text-xs text-purple-700 mt-1 flex items-center gap-1 font-medium">
                                        🔍 Always uses vision analysis
                                    </div>
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
