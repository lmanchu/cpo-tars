# Browser Agent 整合到 CPO TARS 指南

## CPO TARS 現有架構分析

### 當前標籤結構 (TabNav.tsx)

```typescript
const tabs = ['Chat', 'Translation', 'Macros', 'VLM', 'Settings'];
```

1. **Chat** - Gemini 對話功能 (conversation.tsx)
2. **Translation** - 翻譯歷史記錄
3. **Macros** - 快捷操作
4. **VLM** - Vision Language Model (Coming soon)
5. **Settings** - 設定頁面 (API Key 配置)

### 現有組件

- `src/sidepanel/App.tsx` - 主應用程式
- `src/sidepanel/components/Header.tsx` - 頂部標題
- `src/sidepanel/components/TabNav.tsx` - 標籤導航
- `src/sidepanel/components/Settings.tsx` - 設定頁面
- `src/sidepanel/components/MacrosTab.tsx` - 快捷操作
- `src/sidepanel/pages/conversation.tsx` - 對話頁面

### 已實現的功能

✅ CDP 全頁截圖 (`src/utils/tab-selection.ts`)
✅ Gemini API 整合 (`src/libs/chatbot/gemini/GeminiBot.ts`)
✅ Settings 中的 API Key 配置
✅ QuickPromptButtons (📝💡✍️✅)

## Browser Agent 整合方案

### 方案 1: 使用現有的 VLM 標籤 ⭐ 推薦

**優點**:
- 不需要修改標籤列表
- VLM 標籤目前是 "Coming soon",正好可以用
- 語義上合理 (Browser Agent 是 Vision Language Model 的應用)

**實現步驟**:

#### 1. 修改 App.tsx

```typescript
import { BrowserAgentPanel } from './components/BrowserAgentPanel';

// 在 return 中,將 VLM 區塊改為:
{activeTab === 'VLM' && (
    <BrowserAgentPanel />
)}
```

#### 2. 完整代碼

```typescript
// src/sidepanel/App.tsx
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TabNav } from './components/TabNav';
import { Settings } from './components/Settings';
import { MacrosTab } from './components/MacrosTab';
import { BrowserAgentPanel } from './components/BrowserAgentPanel';  // 新增
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

        const interval = setInterval(loadData, 2000);

        const handleSwitchToChat = () => {
            setActiveTab('Chat');
        };
        window.addEventListener('switch-to-chat', handleSwitchToChat);

        return () => {
            clearInterval(interval);
            window.removeEventListener('switch-to-chat', handleSwitchToChat);
        };
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
                {/* 新增: Browser Agent */}
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
```

### 方案 2: 添加新的 "Agent" 標籤

**優點**:
- 獨立的 Agent 頁面
- 更明確的功能定位

**實現步驟**:

#### 1. 修改 TabNav.tsx

```typescript
// src/sidepanel/components/TabNav.tsx
export const TabNav = ({ activeTab, onTabChange }: TabNavProps) => {
    const tabs = ['Chat', 'Translation', 'Macros', 'VLM', 'Agent', 'Settings'];  // 新增 'Agent'
    return (
        <div className="flex border-b bg-white">
            {tabs.map(tab => (
                <button
                    key={tab}
                    className={`flex-1 p-2 text-sm ${activeTab === tab ? 'border-b-2 border-primary-500 text-primary-500 font-medium' : 'text-gray-500'}`}
                    onClick={() => onTabChange(tab)}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
};
```

#### 2. 修改 App.tsx

```typescript
import { BrowserAgentPanel } from './components/BrowserAgentPanel';

// 在 return 中添加:
{activeTab === 'Agent' && (
    <BrowserAgentPanel />
)}
```

### 方案 3: 整合到 Chat 頁面作為浮動按鈕

**優點**:
- 不佔用標籤位置
- 隨時可以在 Chat 中啟動 Agent
- 與對話功能自然結合

**實現步驟**:

#### 修改 conversation.tsx

```typescript
// src/sidepanel/pages/conversation.tsx
import { useState } from 'react';
import { BrowserAgentPanel } from '../components/BrowserAgentPanel';

// 在組件中添加
const [showBrowserAgent, setShowBrowserAgent] = useState(false);

// 在 return 的最後添加浮動按鈕和 modal
return (
    <div className="...">
        {/* ... 現有的 Chat UI ... */}

        {/* Browser Agent 浮動按鈕 */}
        <button
            onClick={() => setShowBrowserAgent(true)}
            className="fixed right-4 bottom-20 w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-2xl z-40"
            title="Browser Agent"
        >
            🤖
        </button>

        {/* Browser Agent Modal */}
        {showBrowserAgent && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
                <div className="w-full max-w-3xl h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden">
                    <BrowserAgentPanel onClose={() => setShowBrowserAgent(false)} />
                </div>
            </div>
        )}
    </div>
);
```

### 方案 4: 整合到 Macros 作為智能操作

**優點**:
- 將 Agent 作為高級 Macro 功能
- 用戶可以創建自定義 Agent 任務

**實現步驟**:

#### 修改 MacrosTab.tsx

```typescript
// src/sidepanel/components/MacrosTab.tsx
import { runBrowserAgent } from '~utils/browser-agent';

const agentMacros = [
    {
        id: 'agent-smart-fill',
        icon: '🤖',
        title: 'AI 自動填表',
        description: '讓 AI 自動識別並填寫表單',
        action: async () => {
            const task = prompt('請描述你要 AI 執行的任務:');
            if (!task) return;

            try {
                const result = await runBrowserAgent(task);
                alert(`任務完成: ${result}`);
            } catch (error) {
                alert(`任務失敗: ${error.message}`);
            }
        }
    },
    {
        id: 'agent-search',
        icon: '🔍',
        title: 'AI 智能搜尋',
        description: '讓 AI 執行搜尋並提取結果',
        action: async () => {
            const query = prompt('請輸入搜尋關鍵字:');
            if (!query) return;

            try {
                const result = await runBrowserAgent(
                    `在搜尋框搜尋 "${query}" 並提取前 5 個結果的標題和連結`
                );
                alert(`搜尋完成: ${result}`);
            } catch (error) {
                alert(`搜尋失敗: ${error.message}`);
            }
        }
    },
    {
        id: 'agent-extract',
        icon: '📊',
        title: 'AI 資料提取',
        description: '讓 AI 從頁面提取資料',
        action: async () => {
            const what = prompt('請描述要提取什麼資料:');
            if (!what) return;

            try {
                const result = await runBrowserAgent(`提取這個頁面上的${what}`);
                alert(`提取完成: ${result}`);
            } catch (error) {
                alert(`提取失敗: ${error.message}`);
            }
        }
    }
];

// 在 MacrosTab return 中添加 Agent Macros 區塊
<div className="bg-white p-4 rounded shadow-sm">
    <h3 className="font-bold mb-2 text-gray-700 flex items-center gap-2">
        <span>🤖</span>
        AI Agent
    </h3>
    <div className="grid grid-cols-2 gap-2">
        {agentMacros.map(macro => (
            <button
                key={macro.id}
                onClick={macro.action}
                className="flex flex-col items-start gap-1 p-3 border rounded hover:bg-gray-50 hover:border-blue-300 transition-colors"
            >
                <div className="text-2xl">{macro.icon}</div>
                <div className="text-sm font-medium text-gray-900">{macro.title}</div>
                <div className="text-xs text-gray-500">{macro.description}</div>
            </button>
        ))}
    </div>
</div>
```

## BrainyAI 可用組件分析

經過檢查 BrainyAI 的代碼,發現:

### ✅ 可以參考的架構模式

1. **Provider 模式** - `SidePanelProvider`, `CommonShortcutProvider`
2. **React Router** - 使用 React Router 進行路由管理

### ❌ 不可用的組件

大部分 BrainyAI 的 sidepanel 組件都是空的或未實現:
- `Layout.tsx` - 空組件
- `FunctionalSideBar.tsx` - 空組件

### 📦 可用的通用組件

```typescript
// /private/tmp/BrainyAi/component/common/
- ChatCaptchaBanner.tsx - Captcha 橫幅
- CPopover.tsx - Popover 組件
- CTooltip.tsx - Tooltip 組件
```

**建議**: CPO TARS 不需要依賴 BrainyAI 的組件,現有的 Tailwind CSS + 自定義組件已經足夠。

## 推薦整合方案總結

### 🏆 最佳方案: 方案 1 (使用 VLM 標籤)

**理由**:
1. ✅ 不需要修改標籤數量,避免擠壓現有空間
2. ✅ VLM 標籤語義合理 (Browser Agent 是 VLM 的應用)
3. ✅ 實現簡單,只需修改 App.tsx
4. ✅ 給 VLM 標籤實際功能

**實施步驟**:

```bash
# 1. 編輯 App.tsx
# 2. 添加 import
import { BrowserAgentPanel } from './components/BrowserAgentPanel';

# 3. 替換 VLM 標籤內容
{activeTab === 'VLM' && (
    <BrowserAgentPanel />
)}

# 4. 重新載入擴充功能測試
```

### 🥈 次佳方案: 方案 3 (Chat 浮動按鈕)

**理由**:
1. ✅ 不佔用標籤空間
2. ✅ 與 Chat 功能自然結合
3. ✅ 隨時可以啟動 Agent
4. ⚠️ 需要額外的 modal 管理

**適合場景**: 如果用戶希望在對話時隨時啟動 Agent

### 🥉 備選方案: 方案 4 (Macros 整合)

**理由**:
1. ✅ 將 Agent 作為進階 Macro 功能
2. ✅ 可以預設多個常用 Agent 任務
3. ⚠️ 需要修改 MacrosTab.tsx
4. ⚠️ 缺少完整的 UI 界面

**適合場景**: 如果用戶希望快速執行預設的 Agent 任務

## 檔案清單

### 已創建的 Browser Agent 檔案

1. ✅ `src/utils/browser-agent.ts` - 核心引擎
2. ✅ `src/sidepanel/components/BrowserAgentPanel.tsx` - UI 組件
3. ✅ `LLM-AGENT-BROWSER-INTERACTION.md` - 研究文檔
4. ✅ `BROWSER-AGENT-USAGE.md` - 使用指南

### 需要修改的檔案 (方案 1)

1. ⚡ `src/sidepanel/App.tsx` - 添加 BrowserAgentPanel import 和渲染

### 需要修改的檔案 (方案 2)

1. ⚡ `src/sidepanel/components/TabNav.tsx` - 添加 'Agent' 標籤
2. ⚡ `src/sidepanel/App.tsx` - 添加 Agent 標籤渲染

### 需要修改的檔案 (方案 3)

1. ⚡ `src/sidepanel/pages/conversation.tsx` - 添加浮動按鈕和 modal

### 需要修改的檔案 (方案 4)

1. ⚡ `src/sidepanel/components/MacrosTab.tsx` - 添加 Agent macros

## 測試計劃

### 1. 基本功能測試

```typescript
// 在簡單頁面測試
await runBrowserAgent("點擊頁面上的第一個按鈕");
```

### 2. 截圖 + DOM 測試

```typescript
// 驗證觀察功能
const observation = await observePage();
console.log('Elements found:', observation.dom.elements.length);
console.log('Screenshot size:', observation.screenshot.length);
```

### 3. 操作測試

```typescript
// 測試各種操作
await executeAction({ type: 'click', params: { elementId: 5 } });
await executeAction({ type: 'type', params: { elementId: 8, text: 'test' } });
await executeAction({ type: 'scroll', params: { direction: 'down' } });
```

### 4. 端到端測試

```typescript
// 完整的 Agent 任務
await runBrowserAgent(
    "在 Google 搜尋 'Gemini API' 並打開第一個結果",
    20,
    (step) => {
        console.log(`Step ${step.stepNumber}:`, step.action.thought);
    }
);
```

## 下一步行動

1. ✅ **選擇整合方案** - 推薦方案 1 (VLM 標籤)
2. ⏭️ **實施整合** - 修改 App.tsx
3. ⏭️ **測試基本功能** - 在簡單頁面測試
4. ⏭️ **優化 UI/UX** - 根據測試結果調整界面
5. ⏭️ **添加安全機制** - 敏感操作確認
6. ⏭️ **撰寫用戶文檔** - 使用說明和範例

## 常見問題

### Q: Browser Agent 需要額外的權限嗎?

A: 不需要。CPO TARS 已經有 `tabs`, `scripting`, `debugger` 權限。

### Q: 會不會影響現有功能?

A: 不會。Browser Agent 是獨立模組,不會影響現有的 Chat, Translation, Macros 功能。

### Q: API 配額會用很快嗎?

A: 會。每個 Agent 步驟 = 1 次 API 調用。20 步任務 = 20 次 API 調用。建議用戶使用付費 API。

### Q: 可以同時運行多個 Agent 嗎?

A: 目前不建議。一次運行一個 Agent 任務比較穩定。可以在未來版本中添加多 Agent 支援。

### Q: 如何停止正在運行的 Agent?

A: BrowserAgentPanel 組件已經有 "停止" 按鈕。點擊後會停止 Agent 循環。
