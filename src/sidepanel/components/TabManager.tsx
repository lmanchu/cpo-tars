import React, { useState, useEffect } from 'react';

interface TabInfo extends chrome.tabs.Tab {
    favicon?: string;
}

interface TabGroup {
    domain: string;
    tabs: TabInfo[];
}

export const TabManager = () => {
    const [tabs, setTabs] = useState<TabInfo[]>([]);
    const [activeTabId, setActiveTabId] = useState<number | undefined>();
    const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        pinned: 0,
        audible: 0,
        loading: 0
    });

    // 載入 tabs
    const loadTabs = async () => {
        try {
            const currentTabs = await chrome.tabs.query({ currentWindow: true });
            setTabs(currentTabs);

            // 計算統計資訊
            setStats({
                total: currentTabs.length,
                pinned: currentTabs.filter(t => t.pinned).length,
                audible: currentTabs.filter(t => t.audible).length,
                loading: currentTabs.filter(t => t.status === 'loading').length
            });

            // 獲取活動 tab
            const activeTab = currentTabs.find(t => t.active);
            setActiveTabId(activeTab?.id);
        } catch (error) {
            console.error('[TabManager] Failed to load tabs:', error);
        }
    };

    useEffect(() => {
        loadTabs();

        // 監聽 tab 變更
        const onTabCreated = () => loadTabs();
        const onTabRemoved = () => loadTabs();
        const onTabUpdated = () => loadTabs();
        const onTabMoved = () => loadTabs();
        const onTabActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
            setActiveTabId(activeInfo.tabId);
            loadTabs();
        };

        chrome.tabs.onCreated.addListener(onTabCreated);
        chrome.tabs.onRemoved.addListener(onTabRemoved);
        chrome.tabs.onUpdated.addListener(onTabUpdated);
        chrome.tabs.onMoved.addListener(onTabMoved);
        chrome.tabs.onActivated.addListener(onTabActivated);

        return () => {
            chrome.tabs.onCreated.removeListener(onTabCreated);
            chrome.tabs.onRemoved.removeListener(onTabRemoved);
            chrome.tabs.onUpdated.removeListener(onTabUpdated);
            chrome.tabs.onMoved.removeListener(onTabMoved);
            chrome.tabs.onActivated.removeListener(onTabActivated);
        };
    }, []);

    // 切換到指定 tab
    const switchToTab = async (tabId: number) => {
        try {
            await chrome.tabs.update(tabId, { active: true });
        } catch (error) {
            console.error('[TabManager] Failed to switch tab:', error);
        }
    };

    // 關閉 tab
    const closeTab = async (tabId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        try {
            await chrome.tabs.remove(tabId);
        } catch (error) {
            console.error('[TabManager] Failed to close tab:', error);
        }
    };

    // 固定/取消固定 tab
    const togglePinTab = async (tabId: number, isPinned: boolean, event: React.MouseEvent) => {
        event.stopPropagation();
        try {
            await chrome.tabs.update(tabId, { pinned: !isPinned });
        } catch (error) {
            console.error('[TabManager] Failed to pin tab:', error);
        }
    };

    // 按域名分組
    const getGroupedTabs = (): TabGroup[] => {
        const groups = new Map<string, TabInfo[]>();

        filteredTabs.forEach(tab => {
            if (!tab.url) return;

            try {
                const url = new URL(tab.url);
                const domain = url.hostname;
                const domainTabs = groups.get(domain) || [];
                domainTabs.push(tab);
                groups.set(domain, domainTabs);
            } catch (e) {
                // Invalid URL
                const domainTabs = groups.get('Other') || [];
                domainTabs.push(tab);
                groups.set('Other', domainTabs);
            }
        });

        return Array.from(groups.entries())
            .map(([domain, tabs]) => ({ domain, tabs }))
            .sort((a, b) => b.tabs.length - a.tabs.length);
    };

    // 搜尋過濾
    const filteredTabs = tabs.filter(tab => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            tab.title?.toLowerCase().includes(term) ||
            tab.url?.toLowerCase().includes(term)
        );
    });

    // 渲染單個 tab
    const renderTab = (tab: TabInfo) => (
        <div
            key={tab.id}
            className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
                tab.id === activeTabId ? 'bg-blue-50 border-l-2 border-blue-500' : ''
            }`}
            onClick={() => tab.id && switchToTab(tab.id)}
        >
            {/* Favicon */}
            <div className="flex-shrink-0 w-4 h-4">
                {tab.favIconUrl ? (
                    <img
                        src={tab.favIconUrl}
                        alt=""
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="w-full h-full bg-gray-300 rounded-sm" />
                )}
            </div>

            {/* Tab 資訊 */}
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                    {tab.title || 'Untitled'}
                </div>
                <div className="text-xs text-gray-500 truncate">
                    {tab.url}
                </div>
            </div>

            {/* 狀態指示器 */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {tab.status === 'loading' && (
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
                {tab.audible && (
                    <span className="text-xs">🔊</span>
                )}
                {tab.pinned && (
                    <button
                        onClick={(e) => tab.id && togglePinTab(tab.id, tab.pinned, e)}
                        className="text-xs hover:bg-gray-200 rounded p-0.5"
                        title="Unpin tab"
                    >
                        📌
                    </button>
                )}
                {!tab.pinned && (
                    <button
                        onClick={(e) => tab.id && togglePinTab(tab.id, tab.pinned, e)}
                        className="text-xs hover:bg-gray-200 rounded p-0.5 opacity-0 group-hover:opacity-100"
                        title="Pin tab"
                    >
                        📍
                    </button>
                )}
            </div>

            {/* 關閉按鈕 */}
            <button
                onClick={(e) => tab.id && closeTab(tab.id, e)}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                title="Close tab"
            >
                ✕
            </button>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-4 border-b">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Tab Manager</h2>

                {/* 統計資訊 */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-bold text-gray-900">{stats.total}</div>
                        <div className="text-xs text-gray-500">Total</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-lg font-bold text-blue-600">{stats.pinned}</div>
                        <div className="text-xs text-gray-500">Pinned</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-lg font-bold text-green-600">{stats.audible}</div>
                        <div className="text-xs text-gray-500">Audio</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                        <div className="text-lg font-bold text-yellow-600">{stats.loading}</div>
                        <div className="text-xs text-gray-500">Loading</div>
                    </div>
                </div>

                {/* 搜尋框 */}
                <input
                    type="text"
                    placeholder="Search tabs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />

                {/* 視圖模式切換 */}
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex-1 py-1.5 text-sm rounded ${
                            viewMode === 'list'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        List View
                    </button>
                    <button
                        onClick={() => setViewMode('grouped')}
                        className={`flex-1 py-1.5 text-sm rounded ${
                            viewMode === 'grouped'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Grouped
                    </button>
                </div>
            </div>

            {/* Tab 列表 */}
            <div className="flex-1 overflow-y-auto">
                {viewMode === 'list' ? (
                    // 列表視圖
                    <div className="p-2 space-y-1">
                        {filteredTabs.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                No tabs found
                            </div>
                        ) : (
                            filteredTabs.map(renderTab)
                        )}
                    </div>
                ) : (
                    // 分組視圖
                    <div className="p-2 space-y-3">
                        {getGroupedTabs().map(group => (
                            <div key={group.domain} className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-3 py-2 border-b">
                                    <div className="text-sm font-medium text-gray-900">
                                        {group.domain}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {group.tabs.length} tab{group.tabs.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                <div className="p-1 space-y-1">
                                    {group.tabs.map(renderTab)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
