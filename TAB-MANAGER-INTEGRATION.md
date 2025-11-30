# Tab Manager 整合指南

## 已創建的檔案

### 1. `TAB-MANAGEMENT-METHODS.md`
完整的 Chrome Tab API 研究文檔,包含:
- 9 種不同的 tab 查看方式
- 實用組合範例
- Chrome API 完整參考
- 最佳實踐建議

### 2. `src/sidepanel/components/TabManager.tsx`
完整的 Tab 管理組件,功能包含:
- ✅ 顯示當前視窗所有 tabs
- ✅ 即時更新 (監聽 tab 變更事件)
- ✅ 搜尋 tabs (按標題或 URL)
- ✅ 兩種視圖模式:
  - **列表視圖**: 顯示所有 tabs
  - **分組視圖**: 按域名分組顯示
- ✅ 統計資訊 (總數、固定、音頻、載入中)
- ✅ Tab 操作:
  - 點擊切換到該 tab
  - 關閉 tab
  - 固定/取消固定 tab
- ✅ 視覺指示:
  - 當前活動 tab 高亮顯示
  - Favicon 顯示
  - 載入狀態動畫
  - 音頻播放指示器 🔊
  - 固定狀態指示器 📌

## 如何整合到 CPO TARS

### 選項 1: 作為獨立 Tab 頁面

編輯 `src/sidepanel/App.tsx`:

```typescript
import { TabManager } from './components/TabManager';

// 在 TabNav 中添加新 tab
const tabs = ['Chat', 'Translation', 'Macros', 'VLM', 'Tabs', 'Settings'];

// 在渲染部分添加
{activeTab === 'Tabs' && (
    <TabManager />
)}
```

### 選項 2: 作為側邊欄彈出面板

創建新文件 `src/sidepanel/components/TabManagerPanel.tsx`:

```typescript
import React, { useState } from 'react';
import { TabManager } from './TabManager';

export const TabManagerPanel = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* 觸發按鈕 */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed right-4 bottom-4 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600"
                title="Tab Manager"
            >
                📑
            </button>

            {/* 側邊面板 */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex">
                    {/* 背景遮罩 */}
                    <div
                        className="flex-1 bg-black bg-opacity-30"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Tab Manager 面板 */}
                    <div className="w-80 bg-white shadow-xl">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="font-bold">Tabs</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="h-[calc(100vh-60px)]">
                            <TabManager />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
```

### 選項 3: 整合到 Chat 頁面

在 `src/sidepanel/pages/conversation.tsx` 中添加快速 tab 切換:

```typescript
import { useState, useEffect } from 'react';

// 在組件中添加
const [recentTabs, setRecentTabs] = useState<chrome.tabs.Tab[]>([]);

useEffect(() => {
    const loadRecentTabs = async () => {
        const tabs = await chrome.tabs.query({
            currentWindow: true,
            lastFocusedWindow: true
        });
        // 獲取最近使用的 5 個 tabs (除了當前 tab)
        setRecentTabs(tabs.filter(t => !t.active).slice(0, 5));
    };

    loadRecentTabs();

    chrome.tabs.onActivated.addListener(loadRecentTabs);
    return () => {
        chrome.tabs.onActivated.removeListener(loadRecentTabs);
    };
}, []);

// 在界面中渲染快速切換按鈕
<div className="flex gap-2 p-2 overflow-x-auto">
    {recentTabs.map(tab => (
        <button
            key={tab.id}
            onClick={() => chrome.tabs.update(tab.id, { active: true })}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
            {tab.favIconUrl && (
                <img src={tab.favIconUrl} className="w-4 h-4" />
            )}
            <span className="text-sm truncate max-w-[150px]">
                {tab.title}
            </span>
        </button>
    ))}
</div>
```

## 需要的權限

確認 `manifest.json` 中包含:

```json
{
  "permissions": [
    "tabs",
    "tabGroups"  // 如果要使用 tab 群組功能
  ]
}
```

目前的 `package.json` 已經包含這些權限:
```json
"permissions": [
  "sidePanel",
  "tabs",
  "storage",
  // ...
]
```

## 進階功能建議

### 1. Tab 書籤功能
```typescript
// 將常用 tabs 加入書籤
const bookmarkTab = async (tab: chrome.tabs.Tab) => {
    const bookmarks = await storage.get<number[]>('bookmarkedTabs') || [];
    if (tab.id && !bookmarks.includes(tab.id)) {
        bookmarks.push(tab.id);
        await storage.set('bookmarkedTabs', bookmarks);
    }
};
```

### 2. Tab 歷史記錄
```typescript
// 追蹤最近訪問的 tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const history = await storage.get<number[]>('tabHistory') || [];
    history.unshift(activeInfo.tabId);
    // 保留最近 50 個
    await storage.set('tabHistory', history.slice(0, 50));
});
```

### 3. Tab 群組管理
```typescript
// 自動按域名分組
const groupTabsByDomain = async () => {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const groups = new Map<string, number[]>();

    for (const tab of tabs) {
        if (!tab.url || !tab.id) continue;
        const domain = new URL(tab.url).hostname;
        const tabIds = groups.get(domain) || [];
        tabIds.push(tab.id);
        groups.set(domain, tabIds);
    }

    // 為每個域名創建群組
    for (const [domain, tabIds] of groups.entries()) {
        if (tabIds.length > 1) {
            const groupId = await chrome.tabs.group({ tabIds });
            await chrome.tabGroups.update(groupId, {
                title: domain,
                color: 'blue'
            });
        }
    }
};
```

### 4. 智能 Tab 建議
```typescript
// 基於 URL 相似度推薦相關 tabs
const getSimilarTabs = async (currentTab: chrome.tabs.Tab) => {
    if (!currentTab.url) return [];

    const currentDomain = new URL(currentTab.url).hostname;
    const allTabs = await chrome.tabs.query({});

    return allTabs.filter(tab => {
        if (!tab.url || tab.id === currentTab.id) return false;
        const domain = new URL(tab.url).hostname;
        return domain === currentDomain;
    });
};
```

### 5. Tab 統計和分析
```typescript
// 追蹤 tab 使用統計
interface TabStats {
    openCount: number;
    totalTimeSpent: number;
    lastAccessed: number;
}

const trackTabUsage = async (tabId: number) => {
    const stats = await storage.get<Record<number, TabStats>>('tabStats') || {};

    if (!stats[tabId]) {
        stats[tabId] = {
            openCount: 0,
            totalTimeSpent: 0,
            lastAccessed: Date.now()
        };
    }

    stats[tabId].openCount++;
    stats[tabId].lastAccessed = Date.now();

    await storage.set('tabStats', stats);
};
```

## 測試步驟

1. **開啟多個 tabs**
   - 開啟不同網站的 tabs
   - 固定幾個 tabs
   - 開啟有音頻的頁面 (YouTube, Spotify 等)

2. **測試基本功能**
   - 搜尋 tabs
   - 切換視圖模式 (列表/分組)
   - 點擊 tab 切換
   - 關閉 tab
   - 固定/取消固定 tab

3. **測試即時更新**
   - 開啟新 tab → 應該自動出現在列表中
   - 關閉 tab → 應該自動從列表中移除
   - 切換 tab → 高亮顯示應該更新
   - 改變 URL → tab 資訊應該更新

4. **測試效能**
   - 開啟 50+ tabs 測試性能
   - 快速切換 tabs
   - 頻繁搜尋

## 已知限制

1. **權限限制**: 需要 `tabs` 權限才能訪問 tab URL 和 title
2. **Chrome 限制**: 某些特殊頁面 (chrome://, edge://, chrome-extension://) 可能無法訪問
3. **性能考量**: 太多 tabs (100+) 可能影響性能,建議添加虛擬滾動
4. **無痕模式**: 無痕視窗的 tabs 需要特別權限才能訪問

## 完整的 Chrome Tab API 參考

詳見 `TAB-MANAGEMENT-METHODS.md` 文檔,包含:
- 完整的 API 列表和用法
- 實用範例代碼
- Tab 屬性完整說明
- 事件監聽器完整列表
- 最佳實踐建議
