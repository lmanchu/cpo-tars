import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TabNav } from './components/TabNav';
import { Settings } from './components/Settings';
import { MacrosTab } from './components/MacrosTab';
import { BrowserAgentPanel } from './components/BrowserAgentPanel';
import { getStorage, setStorage } from '~utils/storage';
import type { UserSettings } from '~types';
import Conversation from '~sidepanel/pages/conversation';

export const App = () => {
    const [activeTab, setActiveTab] = useState('Chat');
    const [settings, setSettings] = useState<UserSettings>({
        theme: 'system',
        targetLanguage: 'en',
        translationEngine: 'google',
        chatbotEngine: 'gemini',
        isPro: false
    });

    useEffect(() => {
        const loadData = async () => {
            const s = await getStorage<UserSettings>('userSettings');
            if (s) setSettings(s);
        };
        loadData();

        // Listen for switch-to-chat event from MacrosTab
        const handleSwitchToChat = () => {
            setActiveTab('Chat');
        };
        window.addEventListener('switch-to-chat', handleSwitchToChat);

        return () => {
            window.removeEventListener('switch-to-chat', handleSwitchToChat);
        };
    }, []);

    const updateSettings = async (newSettings: Partial<UserSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        await setStorage('userSettings', updated);
    };

    return (
        <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Header />
            <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex-1 overflow-auto" style={{ padding: activeTab === 'Chat' ? 0 : '1rem' }}>
                {activeTab === 'Chat' && (
                    <Conversation />
                )}
                {activeTab === 'Macros' && (
                    <MacrosTab />
                )}
                {activeTab === 'VLM' && (
                    <BrowserAgentPanel />
                )}
                {activeTab === 'Settings' && (
                    <Settings settings={settings} onUpdate={updateSettings} />
                )}
            </div>
        </div>
    );
};
