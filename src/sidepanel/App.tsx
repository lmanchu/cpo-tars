import React, { useState } from 'react';
import { Header } from './components/Header';
import { TabNav } from './components/TabNav';
import { Settings } from './components/Settings';

export const App = () => {
    const [activeTab, setActiveTab] = useState('Translation');

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <Header />
            <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex-1 overflow-auto p-4">
                {activeTab === 'Translation' && (
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded shadow-sm">
                            <h3 className="font-bold mb-2">Immersive Translation</h3>
                            <p className="text-sm text-gray-600">Select text on any page to translate.</p>
                        </div>
                    </div>
                )}
                {activeTab === 'Macros' && (
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded shadow-sm">
                            <h3 className="font-bold mb-2">Prompt Macros</h3>
                            <p className="text-sm text-gray-600">Use shortcuts to trigger macros.</p>
                        </div>
                    </div>
                )}
                {activeTab === 'VLM' && (
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded shadow-sm">
                            <h3 className="font-bold mb-2">Vision Analysis</h3>
                            <p className="text-sm text-gray-600">Capture screenshot to analyze.</p>
                        </div>
                    </div>
                )}
            </div>
            <Settings />
        </div>
    );
};
