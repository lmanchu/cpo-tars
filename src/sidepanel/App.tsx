import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TabNav } from './components/TabNav';
import { Settings } from './components/Settings';
import { MacrosTab } from './components/MacrosTab';
import { getHistory } from '~utils/history';
import { getStorage, setStorage } from '~utils/storage';
import type { TranslationHistory, UserSettings } from '~types';
import Conversation from '~sidepanel/pages/conversation';

export const App = () => {
    const [activeTab, setActiveTab] = useState('Chat');
    const [history, setHistory] = useState<TranslationHistory[]>([]);
    const [settings, setSettings] = useState<UserSettings>({
        theme: 'system',
        targetLanguage: 'en',
        translationEngine: 'google',
        chatbotEngine: 'gemini',
        isPro: false
    });

    useEffect(() => {
        const loadData = async () => {
            const h = await getHistory();
            setHistory(h);
            const s = await getStorage<UserSettings>('userSettings');
            if (s) setSettings(s);
        };
        loadData();

        // Poll for history updates (simple way to sync)
        const interval = setInterval(loadData, 2000);
        return () => clearInterval(interval);
    }, []);

    const updateSettings = async (newSettings: Partial<UserSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        await setStorage('userSettings', updated);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <Header />
            <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex-1 overflow-auto" style={{ padding: activeTab === 'Chat' ? 0 : '1rem' }}>
                {activeTab === 'Chat' && (
                    <Conversation />
                )}
                {activeTab === 'Translation' && (
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded shadow-sm">
                            <h3 className="font-bold mb-2 text-gray-700">Recent Translations</h3>
                            {history.length === 0 ? (
                                <p className="text-sm text-gray-400">No history yet. Select text on any page to translate.</p>
                            ) : (
                                <div className="space-y-3">
                                    {history.map(item => (
                                        <div key={item.id} className="border-b border-gray-100 pb-2 last:border-0">
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>{item.sourceLang} → {item.targetLang}</span>
                                                <span className="uppercase">{item.engine}</span>
                                            </div>
                                            <div className="text-sm text-gray-800 font-medium">{item.translatedText}</div>
                                            <div className="text-xs text-gray-500 truncate mt-1">{item.originalText}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'Macros' && (
                    <MacrosTab />
                )}
                {activeTab === 'VLM' && (
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded shadow-sm">
                            <h3 className="font-bold mb-2">Vision Analysis</h3>
                            <p className="text-sm text-gray-600">Coming soon...</p>
                        </div>
                    </div>
                )}
                {activeTab === 'Settings' && (
                    <Settings settings={settings} onUpdate={updateSettings} />
                )}
            </div>
        </div>
    );
};
