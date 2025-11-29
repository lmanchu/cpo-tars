import React from 'react';
import type { UserSettings } from '~types';

interface SettingsProps {
    settings: UserSettings;
    onUpdate: (settings: Partial<UserSettings>) => void;
}

export const Settings = ({ settings, onUpdate }: SettingsProps) => {
    return (
        <div className="space-y-6">
            {/* Translation Settings */}
            <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="font-bold mb-4 text-gray-700 border-b pb-2">Translation Settings</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-2">Target Language</label>
                        <select
                            className="w-full text-sm border rounded p-2"
                            value={settings.targetLanguage}
                            onChange={(e) => onUpdate({ targetLanguage: e.target.value })}
                        >
                            <option value="en">English</option>
                            <option value="zh-TW">Traditional Chinese</option>
                            <option value="ja">Japanese</option>
                            <option value="ko">Korean</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-2">Translation Engine</label>
                        <div className="flex gap-3">
                            <button
                                className={`flex-1 py-2 px-3 text-sm rounded border ${settings.translationEngine === 'google' ? 'bg-primary-50 border-primary-500 text-primary-700 font-medium' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                onClick={() => onUpdate({ translationEngine: 'google' })}
                            >
                                Google (Free)
                            </button>
                            <button
                                className={`flex-1 py-2 px-3 text-sm rounded border ${settings.translationEngine === 'gemini' ? 'bg-primary-50 border-primary-500 text-primary-700 font-medium' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                onClick={() => onUpdate({ translationEngine: 'gemini' })}
                            >
                                Gemini
                            </button>
                        </div>
                        {settings.translationEngine === 'google' && (
                            <p className="text-xs text-gray-500 mt-2">Using free Google Translate API</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Chatbot Settings */}
            <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="font-bold mb-4 text-gray-700 border-b pb-2">Chatbot Settings</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-2">Chatbot Engine</label>
                        <div className="flex gap-3">
                            <button
                                className="flex-1 py-2 px-3 text-sm rounded border bg-primary-50 border-primary-500 text-primary-700 font-medium"
                                disabled
                            >
                                Gemini 2.0 Flash
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Currently only Gemini is supported for chatbot</p>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-2">Gemini API Key</label>
                        <input
                            type="password"
                            className="w-full text-sm border rounded p-2"
                            placeholder="Enter your Gemini API Key"
                            value={settings.geminiApiKey || ''}
                            onChange={(e) => onUpdate({ geminiApiKey: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Get your API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">Google AI Studio</a>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isPro"
                            checked={settings.isPro}
                            onChange={(e) => onUpdate({ isPro: e.target.checked })}
                        />
                        <label htmlFor="isPro" className="text-sm text-gray-600">I have Pro Plan (Unlimited Quota)</label>
                    </div>
                </div>
            </div>

            {/* General Settings */}
            <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="font-bold mb-4 text-gray-700 border-b pb-2">General Settings</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-2">Theme</label>
                        <select
                            className="w-full text-sm border rounded p-2"
                            value={settings.theme}
                            onChange={(e) => onUpdate({ theme: e.target.value as 'light' | 'dark' | 'system' })}
                        >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="system">System</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};
