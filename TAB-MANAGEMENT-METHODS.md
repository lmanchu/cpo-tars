# Chrome Extension - Tab 管理方法總覽

## 目前使用的方法

### 1. 獲取當前活動 Tab
```typescript
// 當前使用於: background/index.ts, utils/tab-selection.ts
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
```

## 其他可用的 Tab 查看方式

### 2. 獲取所有 Tabs (所有視窗)
```typescript
// 獲取瀏覽器中所有打開的 tabs
const allTabs = await chrome.tabs.query({});

// 使用範例:
allTabs.forEach(tab => {
    console.log(`Tab ${tab.id}: ${tab.title}`);
    console.log(`  URL: ${tab.url}`);
    console.log(`  Window: ${tab.windowId}`);
});
```

### 3. 獲取當前視窗的所有 Tabs
```typescript
// 只獲取當前視窗的 tabs
const currentWindowTabs = await chrome.tabs.query({ currentWindow: true });

// 可以在側邊欄顯示 tab 列表
currentWindowTabs.forEach(tab => {
    console.log(`${tab.index + 1}. ${tab.title} ${tab.active ? '(活動)' : ''}`);
});
```

### 4. 獲取所有視窗及其 Tabs
```typescript
// 獲取所有視窗,並包含 tabs 資訊
const allWindows = await chrome.windows.getAll({ populate: true });

allWindows.forEach(window => {
    console.log(`Window ${window.id} (${window.type}):`);
    window.tabs?.forEach(tab => {
        console.log(`  - ${tab.title}`);
    });
});
```

### 5. 根據條件篩選 Tabs
```typescript
// 獲取特定 URL 的 tabs
const googleTabs = await chrome.tabs.query({
    url: "*://www.google.com/*"
});

// 獲取已固定的 tabs
const pinnedTabs = await chrome.tabs.query({ pinned: true });

// 獲取正在載入的 tabs
const loadingTabs = await chrome.tabs.query({ status: "loading" });

// 獲取有音頻播放的 tabs
const audibleTabs = await chrome.tabs.query({ audible: true });

// 獲取被靜音的 tabs
const mutedTabs = await chrome.tabs.query({ muted: true });
```

### 6. 獲取 Tab Groups (Chrome 89+)
```typescript
// 獲取所有 tab 群組
const groups = await chrome.tabGroups.query({});

groups.forEach(async group => {
    console.log(`Group ${group.id}: ${group.title || 'Unnamed'}`);
    console.log(`  Color: ${group.color}`);

    // 獲取此群組中的 tabs
    const groupTabs = await chrome.tabs.query({ groupId: group.id });
    console.log(`  Tabs: ${groupTabs.length}`);
});

// 獲取當前視窗的 tab 群組
const currentWindowGroups = await chrome.tabGroups.query({
    windowId: chrome.windows.WINDOW_ID_CURRENT
});
```

### 7. 獲取最近關閉的 Tabs
```typescript
// 獲取最近關閉的 tabs 和視窗
const recentlyClosed = await chrome.sessions.getRecentlyClosed({
    maxResults: 10
});

recentlyClosed.forEach(session => {
    if (session.tab) {
        console.log(`Recently closed tab: ${session.tab.title}`);
    } else if (session.window) {
        console.log(`Recently closed window with ${session.window.tabs.length} tabs`);
    }
});
```

### 8. 監聽 Tab 事件
```typescript
// 監聽 tab 切換
chrome.tabs.onActivated.addListener((activeInfo) => {
    console.log(`Switched to tab ${activeInfo.tabId} in window ${activeInfo.windowId}`);
});

// 監聽 tab 更新 (URL 變更、載入狀態等)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        console.log(`Tab ${tabId} finished loading: ${tab.title}`);
    }
    if (changeInfo.url) {
        console.log(`Tab ${tabId} navigated to: ${changeInfo.url}`);
    }
});

// 監聽 tab 創建
chrome.tabs.onCreated.addListener((tab) => {
    console.log(`New tab created: ${tab.id}`);
});

// 監聽 tab 移除
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    console.log(`Tab ${tabId} closed`);
});

// 監聽 tab 移動
chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
    console.log(`Tab ${tabId} moved from ${moveInfo.fromIndex} to ${moveInfo.toIndex}`);
});
```

### 9. 獲取特定 Tab 的詳細資訊
```typescript
// 通過 ID 獲取 tab
const tab = await chrome.tabs.get(tabId);

// 獲取 zoom 級別
const zoomLevel = await chrome.tabs.getZoom(tabId);

// 獲取 tab 的截圖 (可見區域)
const screenshot = await chrome.tabs.captureVisibleTab(windowId, {
    format: 'png',
    quality: 90
});
```

## 實用組合方式

### 在側邊欄顯示 Tab 列表
```typescript
export const TabListComponent = () => {
    const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);

    useEffect(() => {
        // 載入當前視窗的 tabs
        const loadTabs = async () => {
            const currentTabs = await chrome.tabs.query({ currentWindow: true });
            setTabs(currentTabs);
        };

        loadTabs();

        // 監聽 tab 變更
        const onTabChanged = () => loadTabs();
        chrome.tabs.onCreated.addListener(onTabChanged);
        chrome.tabs.onRemoved.addListener(onTabChanged);
        chrome.tabs.onUpdated.addListener(onTabChanged);
        chrome.tabs.onMoved.addListener(onTabChanged);

        return () => {
            chrome.tabs.onCreated.removeListener(onTabChanged);
            chrome.tabs.onRemoved.removeListener(onTabChanged);
            chrome.tabs.onUpdated.removeListener(onTabChanged);
            chrome.tabs.onMoved.removeListener(onTabChanged);
        };
    }, []);

    return (
        <div className="tab-list">
            {tabs.map(tab => (
                <div
                    key={tab.id}
                    className={tab.active ? 'active' : ''}
                    onClick={() => chrome.tabs.update(tab.id, { active: true })}
                >
                    <img src={tab.favIconUrl} alt="" />
                    <span>{tab.title}</span>
                </div>
            ))}
        </div>
    );
};
```

### 搜尋 Tabs
```typescript
export async function searchTabs(searchTerm: string) {
    const allTabs = await chrome.tabs.query({});

    return allTabs.filter(tab =>
        tab.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tab.url?.toLowerCase().includes(searchTerm.toLowerCase())
    );
}
```

### 按域名分組 Tabs
```typescript
export async function groupTabsByDomain() {
    const allTabs = await chrome.tabs.query({ currentWindow: true });

    const grouped = new Map<string, chrome.tabs.Tab[]>();

    allTabs.forEach(tab => {
        if (!tab.url) return;

        const domain = new URL(tab.url).hostname;
        const tabs = grouped.get(domain) || [];
        tabs.push(tab);
        grouped.set(domain, tabs);
    });

    return grouped;
}
```

### 獲取 Tab 統計資訊
```typescript
export async function getTabStats() {
    const allTabs = await chrome.tabs.query({});

    return {
        total: allTabs.length,
        active: allTabs.filter(t => t.active).length,
        pinned: allTabs.filter(t => t.pinned).length,
        audible: allTabs.filter(t => t.audible).length,
        loading: allTabs.filter(t => t.status === 'loading').length,
        byWindow: allTabs.reduce((acc, tab) => {
            acc[tab.windowId] = (acc[tab.windowId] || 0) + 1;
            return acc;
        }, {} as Record<number, number>)
    };
}
```

## Chrome APIs 權限要求

在 `manifest.json` 中需要的權限:

```json
{
  "permissions": [
    "tabs",           // 基本 tab 操作
    "tabGroups",      // Tab 群組功能
    "sessions"        // 最近關閉的 tabs
  ],
  "host_permissions": [
    "<all_urls>"      // 訪問 tab URL 需要
  ]
}
```

## Tab 屬性完整列表

```typescript
interface Tab {
    id?: number;                    // Tab ID
    index: number;                  // Tab 在視窗中的位置
    windowId: number;               // 所屬視窗 ID
    openerTabId?: number;           // 打開此 tab 的 tab ID
    highlighted: boolean;           // 是否高亮顯示
    active: boolean;                // 是否為活動 tab
    pinned: boolean;                // 是否固定
    audible?: boolean;              // 是否播放音頻
    discarded: boolean;             // 是否被丟棄(記憶體優化)
    autoDiscardable: boolean;       // 是否可自動丟棄
    mutedInfo?: MutedInfo;          // 靜音資訊
    url?: string;                   // URL
    pendingUrl?: string;            // 正在載入的 URL
    title?: string;                 // 標題
    favIconUrl?: string;            // Favicon URL
    status?: 'loading' | 'complete'; // 載入狀態
    incognito: boolean;             // 是否為無痕模式
    width?: number;                 // 寬度
    height?: number;                // 高度
    sessionId?: string;             // Session ID
    groupId: number;                // Tab 群組 ID (-1 = 未分組)
}
```

## 最佳實踐

1. **性能考量**: 使用 `chrome.tabs.query()` 時加入適當的篩選條件,避免獲取不必要的 tabs
2. **權限最小化**: 只請求必要的權限,例如如果不需要讀取 URL,就不要請求 `tabs` 權限
3. **事件監聽**: 使用事件監聽器保持 tab 列表同步,而不是頻繁輪詢
4. **錯誤處理**: Tab 可能在操作時被關閉,始終處理 `chrome.runtime.lastError`
5. **用戶隱私**: 尊重無痕模式和敏感 URLs,不要在不必要時記錄 tab 資訊
