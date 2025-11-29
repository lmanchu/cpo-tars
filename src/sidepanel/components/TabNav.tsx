import React from 'react';

interface TabNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const TabNav = ({ activeTab, onTabChange }: TabNavProps) => {
    const tabs = ['Translation', 'Macros', 'VLM'];
    return (
        <div className="flex border-b bg-white">
            {tabs.map(tab => (
                <button
                    key={tab}
                    className={`flex-1 p-2 ${activeTab === tab ? 'border-b-2 border-primary-500 text-primary-500 font-medium' : 'text-gray-500'}`}
                    onClick={() => onTabChange(tab)}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
};
