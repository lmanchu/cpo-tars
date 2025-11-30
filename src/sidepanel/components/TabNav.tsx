import React from 'react';

interface TabNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const TabNav = ({ activeTab, onTabChange }: TabNavProps) => {
    const tabs = ['Chat', 'Macros', 'VLM', 'Settings'];
    return (
        <div className="flex" style={{ borderBottom: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
            {tabs.map(tab => (
                <button
                    key={tab}
                    className={`flex-1 p-2 text-sm ${activeTab === tab ? 'border-b-2 border-primary-500 text-primary-500 font-medium' : ''}`}
                    style={activeTab !== tab ? { color: 'var(--text-tertiary)' } : {}}
                    onClick={() => onTabChange(tab)}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
};
