# Browser Agent 使用指南

## 什麼是 Browser Agent?

Browser Agent 是一個由 LLM (Gemini) 驅動的瀏覽器自動化系統,能夠:

1. **👁️ 觀察** - 通過截圖和 DOM 分析"看到"網頁
2. **🧠 思考** - 理解任務並規劃行動
3. **🎯 執行** - 自動操作網頁 (點擊、輸入、滾動等)
4. **🔄 循環** - 持續執行直到任務完成

## 已創建的檔案

### 核心實現

1. **`src/utils/browser-agent.ts`** - Browser Agent 核心邏輯
   - ✅ DOM 提取 (`extractInteractiveElements`)
   - ✅ 頁面觀察 (`observePage`)
   - ✅ 操作執行 (`executeAction`)
   - ✅ LLM 決策 (`buildAgentPrompt`, `parseAgentResponse`)
   - ✅ Agent 主循環 (`runBrowserAgent`)

2. **`src/sidepanel/components/BrowserAgentPanel.tsx`** - UI 組件
   - ✅ 任務輸入界面
   - ✅ 快速範例按鈕
   - ✅ 執行步驟顯示
   - ✅ 截圖預覽
   - ✅ 進度追蹤

3. **`LLM-AGENT-BROWSER-INTERACTION.md`** - 完整研究文檔
   - 📚 4 種實現方案對比
   - 📚 詳細代碼範例
   - 📚 安全考量
   - 📚 性能優化建議

## 快速開始

### 方式 1: 作為獨立頁面

編輯 `src/sidepanel/App.tsx`:

```typescript
import { BrowserAgentPanel } from './components/BrowserAgentPanel';

export const App = () => {
    const [activeTab, setActiveTab] = useState('Chat');

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <Header />
            <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex-1 overflow-auto">
                {/* ... 其他 tabs ... */}

                {activeTab === 'Agent' && (
                    <BrowserAgentPanel />
                )}
            </div>
        </div>
    );
};
```

在 `src/sidepanel/components/TabNav.tsx` 中添加 "Agent" 標籤。

### 方式 2: 整合到 Chat 頁面

在 `src/sidepanel/pages/conversation.tsx` 中:

```typescript
import { useState } from 'react';
import { BrowserAgentPanel } from '../components/BrowserAgentPanel';

// 在組件中添加
const [showAgentPanel, setShowAgentPanel] = useState(false);

// 添加觸發按鈕
<button
    onClick={() => setShowAgentPanel(true)}
    className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
>
    🤖 Browser Agent
</button>

// 添加面板
{showAgentPanel && (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
        <div className="w-full max-w-2xl h-[80vh] bg-white rounded-lg shadow-xl">
            <BrowserAgentPanel onClose={() => setShowAgentPanel(false)} />
        </div>
    </div>
)}
```

### 方式 3: 作為 Macro 快捷操作

在 `src/sidepanel/components/MacrosTab.tsx` 中添加 Agent macros:

```typescript
const agentMacros = [
    {
        id: 'agent-fill-form',
        name: '智能填表',
        description: 'AI 自動識別並填寫表單',
        icon: '📝',
        action: async () => {
            await runBrowserAgent('識別頁面上的表單並填寫基本資訊');
        }
    },
    {
        id: 'agent-search',
        name: '智能搜尋',
        description: 'AI 自動執行搜尋並提取結果',
        icon: '🔍',
        action: async () => {
            await runBrowserAgent('在搜尋框搜尋並提取前 5 個結果');
        }
    }
];
```

## 使用範例

### 範例 1: 自動填寫表單

```typescript
await runBrowserAgent(
    "找到姓名輸入框填入 'John Doe',找到 email 輸入框填入 'john@example.com',然後點擊提交按鈕"
);
```

**執行過程**:
1. 觀察頁面 → 找到姓名輸入框 (ID: 5)
2. 執行 `type(5, "John Doe")`
3. 觀察頁面 → 找到 email 輸入框 (ID: 8)
4. 執行 `type(8, "john@example.com")`
5. 觀察頁面 → 找到提交按鈕 (ID: 12)
6. 執行 `click(12)`
7. 等待提交 → 完成

### 範例 2: Google 搜尋

```typescript
await runBrowserAgent(
    "在 Google 搜尋 'Gemini 2.0 Flash API documentation' 並打開第一個結果"
);
```

**執行過程**:
1. 觀察頁面 → 找到搜尋框
2. 輸入搜尋關鍵字
3. 點擊搜尋按鈕或按 Enter
4. 等待結果載入
5. 找到第一個結果連結
6. 點擊打開
7. 完成

### 範例 3: 資料提取

```typescript
await runBrowserAgent(
    "提取這個頁面上所有產品的名稱和價格"
);
```

**執行過程**:
1. 觀察頁面並識別產品列表
2. 滾動查看更多產品
3. 提取產品資訊
4. 返回結構化數據
5. 完成

### 範例 4: 多步驟導航

```typescript
await runBrowserAgent(
    "1) 點擊 '登入' 按鈕 2) 輸入測試帳號 test@example.com 3) 輸入密碼 password123 4) 點擊登入 5) 檢查是否成功"
);
```

## API 參考

### `runBrowserAgent(task, maxSteps?, onProgress?)`

執行瀏覽器 Agent 任務。

**參數**:
- `task: string` - 任務描述 (自然語言)
- `maxSteps?: number` - 最大步驟數 (預設 20)
- `onProgress?: (step: AgentStep) => void` - 進度回調

**返回**: `Promise<string>` - 任務結果

**範例**:
```typescript
const result = await runBrowserAgent(
    '在搜尋框搜尋並提取結果',
    15,
    (step) => {
        console.log(`Step ${step.stepNumber}: ${step.action.thought}`);
    }
);
```

### `observePage()`

觀察當前頁面狀態 (截圖 + DOM)。

**返回**: `Promise<Observation>`

```typescript
interface Observation {
    screenshot: string;        // Base64 編碼的截圖
    dom: DOMInfo;             // DOM 結構資訊
    url: string;              // 頁面 URL
    title: string;            // 頁面標題
    timestamp: number;        // 時間戳
}
```

### `extractInteractiveElements(tabId)`

提取頁面中可互動的元素。

**返回**: `Promise<DOMInfo>`

```typescript
interface DOMInfo {
    url: string;
    title: string;
    elements: InteractiveElement[];  // 可互動元素列表
    viewport: {
        width: number;
        height: number;
        scrollX: number;
        scrollY: number;
    };
}

interface InteractiveElement {
    id: number;           // Agent 分配的 ID
    tag: string;          // HTML 標籤
    type: string;         // 輸入框類型
    text: string;         // 元素文字
    placeholder: string;  // placeholder 屬性
    href: string;         // 連結 URL
    value: string;        // 當前值
    ariaLabel: string;    // ARIA 標籤
    rect: {               // 位置和大小
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
```

### `executeAction(action)`

執行單個操作。

**支援的操作**:

```typescript
// 1. 點擊元素 (通過 ID)
await executeAction({
    type: 'click',
    params: { elementId: 5 }
});

// 2. 點擊坐標
await executeAction({
    type: 'click',
    params: { x: 100, y: 200 }
});

// 3. 輸入文字
await executeAction({
    type: 'type',
    params: { elementId: 8, text: 'Hello World' }
});

// 4. 滾動頁面
await executeAction({
    type: 'scroll',
    params: { direction: 'down', amount: 500 }
});

// 5. 等待
await executeAction({
    type: 'wait',
    params: { ms: 2000 }
});

// 6. 導航到新 URL
await executeAction({
    type: 'navigate',
    params: { url: 'https://google.com' }
});

// 7. 任務完成
await executeAction({
    type: 'done',
    params: { result: 'Task completed successfully' }
});
```

## 進階用法

### 自訂 Prompt

如果需要更精確的控制,可以自訂 prompt:

```typescript
import { buildAgentPrompt, parseAgentResponse } from '~utils/browser-agent';

const observation = await observePage();
const customPrompt = buildAgentPrompt(
    '你的任務描述',
    observation,
    []
) + `\n\n額外指示:
- 優先點擊藍色按鈕
- 避免點擊廣告
- 如果找不到元素,先滾動頁面`;

// 然後用這個 prompt 調用 Gemini
```

### 錯誤處理

```typescript
try {
    const result = await runBrowserAgent(task, 20, (step) => {
        console.log(`Step ${step.stepNumber}:`, step.action.thought);

        // 檢查異常情況
        if (step.action.type === 'scroll' && step.stepNumber > 10) {
            throw new Error('Too many scroll actions - may be stuck');
        }
    });

    console.log('Success:', result);
} catch (error) {
    console.error('Agent failed:', error);
    // 處理錯誤
}
```

### 分步執行

如果需要更細粒度的控制:

```typescript
import { observePage, executeAction } from '~utils/browser-agent';

// 手動執行每一步
const observation1 = await observePage();
// 根據 observation1 決定操作
await executeAction({ type: 'click', params: { elementId: 5 } });

const observation2 = await observePage();
// 根據 observation2 決定下一步
await executeAction({ type: 'type', params: { elementId: 8, text: 'test' } });
```

## 限制和注意事項

### 1. 權限要求

確保 `manifest.json` 包含必要權限:

```json
{
  "permissions": [
    "tabs",
    "scripting",
    "debugger"  // 如果使用 CDP
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

### 2. API 配額

- Gemini API 有請求配額限制
- 每次 Agent 步驟都會調用 API
- 20 步可能消耗 20 次 API 配額

### 3. 網頁限制

某些網頁可能阻止自動化:
- CAPTCHA
- 防機器人機制
- 動態載入內容
- Shadow DOM

### 4. 準確性

LLM 決策可能不完美:
- 可能點擊錯誤元素
- 可能誤解任務
- 建議從簡單任務開始測試

### 5. 安全考量

**重要**: 永遠不要讓 Agent 執行敏感操作而不經過用戶確認:
- 提交付款
- 刪除資料
- 發送訊息
- 修改設定

建議實現確認機制:

```typescript
const sensitiveActions = ['submit', 'delete', 'pay', 'send'];

function requiresConfirmation(action: Action): boolean {
    const actionStr = JSON.stringify(action).toLowerCase();
    return sensitiveActions.some(keyword => actionStr.includes(keyword));
}

// 在執行前檢查
if (requiresConfirmation(action)) {
    const confirmed = await getUserConfirmation(
        `Agent wants to: ${action.type}(${JSON.stringify(action.params)})\n\nAllow?`
    );
    if (!confirmed) {
        throw new Error('Action rejected by user');
    }
}
```

## 性能優化

### 1. 減少截圖大小

```typescript
// 在 capturePageScreenshot 中添加品質參數
await chrome.debugger.sendCommand(
    { tabId },
    'Page.captureScreenshot',
    {
        format: 'jpeg',  // 改用 JPEG
        quality: 60,     // 降低品質
        captureBeyondViewport: true
    }
);
```

### 2. 限制 DOM 元素數量

```typescript
// 在 extractInteractiveElements 中
const elements = allElements
    .slice(0, 50)  // 只取前 50 個
    .filter(el => isVisible(el) && isImportant(el));
```

### 3. 智能等待

```typescript
// 使用 MutationObserver 而非固定延遲
async function waitForStable(tabId: number, timeout: number = 5000) {
    await chrome.scripting.executeScript({
        target: { tabId },
        func: (timeout) => {
            return new Promise((resolve) => {
                let timer: number;
                const observer = new MutationObserver(() => {
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                        observer.disconnect();
                        resolve(true);
                    }, 500);
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                setTimeout(() => {
                    observer.disconnect();
                    resolve(false);
                }, timeout);
            });
        },
        args: [timeout]
    });
}
```

## 疑難排解

### 問題 1: Agent 一直滾動頁面

**原因**: LLM 找不到目標元素

**解決方法**:
- 檢查元素是否真的存在
- 提供更明確的任務描述
- 增加元素數量限制

### 問題 2: 點擊錯誤的元素

**原因**: DOM 結構複雜或元素描述不清

**解決方法**:
- 使用更具體的任務描述
- 增加元素的 aria-label
- 改用視覺坐標點擊

### 問題 3: 超過最大步驟數

**原因**: 任務太複雜或 LLM 陷入循環

**解決方法**:
- 將大任務拆分成小任務
- 增加 maxSteps 參數
- 檢查任務是否可行

### 問題 4: API 錯誤

**原因**: Gemini API key 無效或配額用盡

**解決方法**:
- 確認 API key 正確配置
- 檢查 Google AI Studio 配額
- 考慮使用付費方案

## 下一步

1. ✅ **測試基本功能**
   - 在簡單頁面測試 (Google, Wikipedia)
   - 驗證觀察和操作功能

2. ⏭️ **優化 Prompt**
   - 根據測試結果改進 prompt
   - 增加更多範例和指示

3. ⏭️ **添加安全機制**
   - 實現操作確認
   - 添加域名白名單
   - 記錄操作日誌

4. ⏭️ **擴展功能**
   - 支援更多操作類型
   - 添加錯誤恢復機制
   - 實現操作錄製和重播

5. ⏭️ **性能優化**
   - 實現智能快取
   - 優化截圖和 DOM 提取
   - 減少 API 調用次數

## 相關資源

- [Anthropic Computer Use](https://www.anthropic.com/news/computer-use)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Playwright Documentation](https://playwright.dev/)
- [Gemini API Documentation](https://ai.google.dev/docs)
