import React from 'react';
import { TEXT_PROMPTS } from '~utils/prompts';

export const MacrosTab = () => {
    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="font-bold mb-2 text-gray-700">Quick Actions</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Select any text on a webpage to see these quick action buttons appear.
                </p>

                <div className="space-y-3">
                    {TEXT_PROMPTS.filter(p => p.id !== 'ask-ai').map(prompt => (
                        <div key={prompt.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">
                                    {prompt.id === 'summarize' && '📝'}
                                    {prompt.id === 'explain' && '💡'}
                                    {prompt.id === 'rephrase' && '✍️'}
                                    {prompt.id === 'grammar' && '✅'}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800 mb-1">{prompt.title}</h4>
                                    <p className="text-sm text-gray-600">{prompt.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="font-bold mb-2 text-gray-700">How to Use</h3>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                    <li>Select any text on a webpage</li>
                    <li>A floating toolbar will appear above the selected text</li>
                    <li>Click on any icon to perform that action</li>
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
