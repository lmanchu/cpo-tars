# LLM Agent 瀏覽器互動方案

## 核心概念

讓 LLM 成為瀏覽器 agent,能夠:
1. **觀察 (Perceive)**: 看到網頁內容 (視覺 + 結構)
2. **思考 (Reason)**: 理解任務並規劃行動
3. **行動 (Act)**: 執行操作 (點擊、輸入、滾動等)
4. **循環 (Loop)**: 觀察結果 → 下一步行動

## 方案 1: Vision-Based Agent (視覺基礎)

### 優點
- ✅ 能看到真實的視覺效果 (CSS, 動畫, Canvas)
- ✅ 不受 DOM 結構複雜度影響
- ✅ 類似人類操作方式

### 缺點
- ❌ 截圖大小限制 (token 消耗大)
- ❌ 需要坐標計算精確度
- ❌ 無法直接獲取 DOM 元素屬性

### 實現流程

```
User Request
    ↓
LLM 分析任務
    ↓
while (任務未完成) {
    1. 截圖網頁 (CDP full-page screenshot)
    2. LLM 視覺分析 + 決策下一步操作
    3. 執行操作 (click, type, scroll)
    4. 等待頁面更新
    5. 再次截圖觀察結果
}
    ↓
返回結果給用戶
```

### 核心代碼結構

```typescript
// 1. 觀察 (Perceive)
async function observePage(): Promise<{
    screenshot: string;
    url: string;
    title: string;
}> {
    const screenshot = await capturePageScreenshot();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    return {
        screenshot,
        url: tab.url,
        title: tab.title
    };
}

// 2. LLM 決策
async function decideNextAction(
    task: string,
    observation: { screenshot: string; url: string; title: string },
    history: Action[]
): Promise<Action> {
    const prompt = `
任務: ${task}

當前頁面:
- URL: ${observation.url}
- 標題: ${observation.title}

歷史操作:
${history.map((a, i) => `${i + 1}. ${a.type}: ${JSON.stringify(a.params)}`).join('\n')}

請分析截圖並決定下一步操作。

可用操作:
1. click(x, y) - 點擊坐標
2. type(text) - 輸入文字
3. scroll(direction, amount) - 滾動
4. wait(ms) - 等待
5. done(result) - 任務完成

回應格式 (JSON):
{
    "thought": "思考過程",
    "action": "操作類型",
    "params": { "參數" },
    "reason": "執行原因"
}
`;

    const response = await gemini.generateContent({
        contents: [
            { text: prompt },
            {
                inlineData: {
                    mimeType: 'image/png',
                    data: observation.screenshot
                }
            }
        ]
    });

    return JSON.parse(response.text);
}

// 3. 執行操作 (Act)
async function executeAction(action: Action): Promise<void> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    switch (action.type) {
        case 'click':
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (x, y) => {
                    const element = document.elementFromPoint(x, y);
                    if (element instanceof HTMLElement) {
                        element.click();
                    }
                },
                args: [action.params.x, action.params.y]
            });
            break;

        case 'type':
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (text) => {
                    const activeElement = document.activeElement;
                    if (activeElement instanceof HTMLInputElement ||
                        activeElement instanceof HTMLTextAreaElement) {
                        activeElement.value = text;
                        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                },
                args: [action.params.text]
            });
            break;

        case 'scroll':
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (direction, amount) => {
                    window.scrollBy({
                        top: direction === 'down' ? amount : -amount,
                        behavior: 'smooth'
                    });
                },
                args: [action.params.direction, action.params.amount]
            });
            break;

        case 'wait':
            await new Promise(resolve => setTimeout(resolve, action.params.ms));
            break;
    }
}

// 4. Agent Loop
async function runBrowserAgent(task: string): Promise<string> {
    const maxSteps = 20;
    const history: Action[] = [];

    for (let step = 0; step < maxSteps; step++) {
        // 觀察當前頁面
        const observation = await observePage();

        // LLM 決策
        const action = await decideNextAction(task, observation, history);

        console.log(`Step ${step + 1}: ${action.thought}`);
        console.log(`Action: ${action.type}`, action.params);

        // 如果任務完成
        if (action.type === 'done') {
            return action.params.result;
        }

        // 執行操作
        await executeAction(action);
        history.push(action);

        // 等待頁面穩定
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Reached maximum steps without completion');
}
```

## 方案 2: DOM-Based Agent (DOM 結構基礎)

### 優點
- ✅ 精確的元素選擇 (CSS selector, XPath)
- ✅ 可獲取元素屬性、文字內容
- ✅ Token 消耗較少
- ✅ 操作更可靠

### 缺點
- ❌ 看不到視覺效果
- ❌ DOM 結構可能很複雜
- ❌ 動態內容需要等待

### 實現流程

```typescript
// 1. 提取簡化的 DOM 結構
async function extractSimplifiedDOM(): Promise<string> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            // 提取可互動元素
            const elements = [];
            let id = 0;

            // 遍歷所有可互動元素
            const interactiveElements = document.querySelectorAll(
                'a, button, input, textarea, select, [role="button"], [onclick]'
            );

            interactiveElements.forEach(el => {
                // 過濾不可見元素
                const rect = el.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) return;

                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden') return;

                // 添加臨時 ID 方便後續選擇
                el.setAttribute('data-agent-id', String(id));

                elements.push({
                    id: id++,
                    tag: el.tagName.toLowerCase(),
                    type: (el as HTMLInputElement).type || '',
                    text: el.textContent?.trim().substring(0, 50) || '',
                    placeholder: (el as HTMLInputElement).placeholder || '',
                    href: (el as HTMLAnchorElement).href || '',
                    value: (el as HTMLInputElement).value || '',
                    rect: {
                        x: Math.round(rect.x),
                        y: Math.round(rect.y),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height)
                    }
                });
            });

            return {
                url: window.location.href,
                title: document.title,
                elements
            };
        }
    });

    return result.result;
}

// 2. LLM 決策 (基於 DOM)
async function decideDOMAction(
    task: string,
    domInfo: DOMInfo,
    history: Action[]
): Promise<Action> {
    const prompt = `
任務: ${task}

當前頁面:
- URL: ${domInfo.url}
- 標題: ${domInfo.title}

可互動元素:
${domInfo.elements.map(el =>
    `[${el.id}] ${el.tag}${el.type ? `[type=${el.type}]` : ''}: "${el.text}" ${el.href ? `(${el.href})` : ''}`
).join('\n')}

歷史操作:
${history.map((a, i) => `${i + 1}. ${a.type}: ${JSON.stringify(a.params)}`).join('\n')}

請決定下一步操作。

可用操作:
1. click(elementId) - 點擊元素
2. type(elementId, text) - 在輸入框輸入
3. select(elementId, value) - 選擇下拉選項
4. scroll(direction) - 滾動頁面
5. wait(ms) - 等待
6. done(result) - 任務完成

回應格式 (JSON):
{
    "thought": "思考過程",
    "action": "操作類型",
    "params": { "參數" },
    "reason": "執行原因"
}
`;

    const response = await gemini.generateContent(prompt);
    return JSON.parse(response.text);
}

// 3. 執行 DOM 操作
async function executeDOMAction(action: Action): Promise<void> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    switch (action.type) {
        case 'click':
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (elementId) => {
                    const el = document.querySelector(`[data-agent-id="${elementId}"]`);
                    if (el instanceof HTMLElement) {
                        el.click();
                    }
                },
                args: [action.params.elementId]
            });
            break;

        case 'type':
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (elementId, text) => {
                    const el = document.querySelector(`[data-agent-id="${elementId}"]`);
                    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                        el.value = text;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                },
                args: [action.params.elementId, action.params.text]
            });
            break;

        case 'scroll':
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (direction) => {
                    window.scrollBy({
                        top: direction === 'down' ? window.innerHeight : -window.innerHeight,
                        behavior: 'smooth'
                    });
                },
                args: [action.params.direction]
            });
            break;
    }
}
```

## 方案 3: Hybrid Agent (混合方案) ⭐ 推薦

結合視覺和 DOM 的優點:

```typescript
async function observePageHybrid(): Promise<Observation> {
    // 同時獲取截圖和 DOM
    const [screenshot, domInfo] = await Promise.all([
        capturePageScreenshot(),
        extractSimplifiedDOM()
    ]);

    return {
        screenshot,
        dom: domInfo,
        url: domInfo.url,
        title: domInfo.title
    };
}

async function decideBestAction(
    task: string,
    observation: Observation,
    history: Action[]
): Promise<Action> {
    const prompt = `
任務: ${task}

當前頁面:
- URL: ${observation.url}
- 標題: ${observation.title}

可互動元素 (編號對應截圖中標記):
${observation.dom.elements.map(el =>
    `[${el.id}] ${el.tag}: "${el.text}" at (${el.rect.x}, ${el.rect.y})`
).join('\n')}

我提供了:
1. 頁面截圖 - 用於理解視覺佈局
2. 可互動元素列表 - 用於精確操作

請分析並決定下一步操作。優先使用元素 ID 而非坐標點擊。

回應格式 (JSON):
{
    "thought": "思考過程",
    "action": "click|type|scroll|wait|done",
    "params": { "elementId": 123 } 或 { "x": 100, "y": 200 },
    "reason": "執行原因"
}
`;

    const response = await gemini.generateContent({
        contents: [
            { text: prompt },
            {
                inlineData: {
                    mimeType: 'image/png',
                    data: observation.screenshot
                }
            }
        ]
    });

    return JSON.parse(response.text);
}
```

## 方案 4: 使用現有工具 (Playwright/Puppeteer)

### 透過 CDP (Chrome DevTools Protocol)

CPO TARS 已經使用 CDP 進行截圖,可以擴展用於完整的瀏覽器控制:

```typescript
// 使用 CDP 完整控制
async function executeCDPAction(action: Action): Promise<void> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tab.id!;

    await chrome.debugger.attach({ tabId }, '1.3');

    try {
        switch (action.type) {
            case 'click':
                // 獲取元素坐標
                const { x, y } = action.params;

                await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
                    type: 'mousePressed',
                    x,
                    y,
                    button: 'left',
                    clickCount: 1
                });

                await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
                    type: 'mouseReleased',
                    x,
                    y,
                    button: 'left',
                    clickCount: 1
                });
                break;

            case 'type':
                const { text } = action.params;
                for (const char of text) {
                    await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchKeyEvent', {
                        type: 'keyDown',
                        text: char
                    });
                    await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchKeyEvent', {
                        type: 'keyUp',
                        text: char
                    });
                }
                break;

            case 'scroll':
                await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
                    type: 'mouseWheel',
                    x: 100,
                    y: 100,
                    deltaX: 0,
                    deltaY: action.params.direction === 'down' ? 500 : -500
                });
                break;
        }
    } finally {
        await chrome.debugger.detach({ tabId });
    }
}
```

## 實際應用場景

### 1. 自動填表
```typescript
await runBrowserAgent(
    "請在這個表單中填寫: 姓名=John Doe, Email=john@example.com, 然後提交"
);
```

### 2. 網頁搜尋
```typescript
await runBrowserAgent(
    "在 Google 搜尋 'Gemini 2.0 Flash API documentation' 並打開第一個結果"
);
```

### 3. 資料提取
```typescript
const result = await runBrowserAgent(
    "提取這個頁面上所有產品的名稱和價格"
);
```

### 4. 網頁測試
```typescript
await runBrowserAgent(
    "測試登入流程: 1) 點擊登入按鈕 2) 輸入測試帳號 3) 檢查是否成功登入"
);
```

## 安全考量

1. **用戶確認**: 敏感操作 (提交表單、付款) 需要用戶確認
2. **白名單**: 限制可操作的域名
3. **操作記錄**: 記錄所有 agent 操作以便審計
4. **超時限制**: 防止無限循環
5. **沙盒模式**: 在隔離環境中測試

## 性能優化

1. **智能等待**: 使用 MutationObserver 偵測 DOM 變更而非固定延遲
2. **批次操作**: 合併多個簡單操作
3. **快照緩存**: 避免重複截圖
4. **增量 DOM**: 只提取變更的部分

## 下一步實現

建議從簡單到複雜:

1. ✅ **階段 1**: 實現基本觀察 (截圖 + 簡化 DOM)
2. ✅ **階段 2**: 實現基本操作 (點擊、輸入、滾動)
3. ⏭️ **階段 3**: 實現 agent loop (觀察-決策-行動)
4. ⏭️ **階段 4**: 添加錯誤處理和重試機制
5. ⏭️ **階段 5**: 優化 prompt engineering 提升準確率
