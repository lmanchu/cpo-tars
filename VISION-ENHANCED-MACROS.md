# Vision-Enhanced Macros 設計文檔

## 問題分析

### 當前 Macros 的限制

**現有實現** (`MacrosTab.tsx` + `tab-selection.ts`):

```typescript
// 只能獲取純文字
const selectedText = window.getSelection()?.toString();

// 或者頁面的 innerText (最多 3000 字符)
const mainContent = document.body.innerText.substring(0, 3000);
```

**主要限制**:

1. ❌ **只有文字** - 無法理解頁面的視覺呈現
2. ❌ **遺失結構** - 表格、圖表、布局等結構信息丟失
3. ❌ **無法看圖** - 圖片、圖表、截圖等視覺內容完全忽略
4. ❌ **內容截斷** - 限制 3000 字符，長文章被截斷
5. ❌ **上下文缺失** - 無法理解元素之間的視覺關係

### 實際影響的場景

#### 場景 1: 總結帶有圖表的文章
**當前**:
```
User: 點擊 "Summarize" macro
→ 只獲取文字: "Figure 1 shows... Table 2 indicates..."
→ Gemini 看不到 Figure 1 和 Table 2
→ 總結不完整，遺失重要視覺信息
```

**期望**:
```
User: 點擊 "Summarize" macro
→ 獲取截圖 + 文字 + DOM 結構
→ Gemini 可以"看到"圖表和表格
→ 總結包含視覺元素的完整內容
```

#### 場景 2: 解釋複雜的技術文檔
**當前**:
```
User: 點擊 "Explain" macro
→ 只有文字: "The architecture consists of..."
→ 看不到架構圖
→ 解釋缺乏視覺參考
```

**期望**:
```
User: 點擊 "Explain" macro
→ 可以看到架構圖、流程圖、UML 圖等
→ 解釋結合視覺元素，更清晰易懂
```

#### 場景 3: 分析數據儀表板
**當前**:
```
User: 點擊 "Summarize" macro
→ 只能獲取圖表標題和標籤文字
→ 無法理解圖表趨勢、數據分佈
→ 總結毫無意義
```

**期望**:
```
User: 點擊 "Summarize" macro
→ 可以看到完整的圖表視覺呈現
→ 理解數據趨勢、異常值、分佈
→ 提供有意義的數據洞察
```

## 解決方案: Vision-Enhanced Macros

### 核心概念

利用 Browser Agent 的 `observePage()` 功能，為 Macros 添加視覺能力：

```typescript
// Browser Agent 已有的觀察能力
export async function observePage(): Promise<Observation> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 並行獲取截圖和 DOM
    const [screenshot, domInfo] = await Promise.all([
        capturePageScreenshot(),      // CDP 全頁面截圖
        extractInteractiveElements(tab.id)  // DOM 結構
    ]);

    return {
        screenshot,   // Base64 PNG - Gemini 可以"看到"頁面
        dom: domInfo, // 結構化數據 - 元素位置、文字等
        url: domInfo.url,
        title: domInfo.title,
        timestamp: Date.now()
    };
}
```

### 架構設計

#### 方案 1: 增強現有 Macros (推薦)

**修改流程**:

```
Before:
User clicks Macro → getTabSelection() (text only) → Send to Gemini

After:
User clicks Macro → observePage() (screenshot + DOM) → Send to Gemini with vision
```

**優點**:
- ✅ 最小化代碼改動
- ✅ 保持現有 UI 和用戶體驗
- ✅ 向後兼容（如果截圖失敗，降級到純文字）
- ✅ 立即改善所有現有 macros

**缺點**:
- 每次 macro 調用都會截圖（可能較慢）
- API 調用成本增加（vision API 較貴）

#### 方案 2: 添加新的 Vision Macros

**新增功能**:

```typescript
const VISION_PROMPTS: PromptTemplate[] = [
    {
        id: 'vision-summarize',
        title: 'Vision Summarize',
        description: 'Summarize page including images and charts',
        useVision: true
    },
    {
        id: 'describe-visuals',
        title: 'Describe Visuals',
        description: 'Describe all images and diagrams on page',
        useVision: true
    },
    {
        id: 'analyze-chart',
        title: 'Analyze Charts',
        description: 'Analyze data from charts and graphs',
        useVision: true
    }
];
```

**優點**:
- ✅ 用戶可以選擇是否使用視覺功能
- ✅ 保持原有 macros 的速度
- ✅ 清楚區分文字和視覺功能
- ✅ 更好的 API 成本控制

**缺點**:
- 需要維護兩套 macros
- UI 變得更複雜

#### 方案 3: 智能混合 (最佳方案)

**自動檢測是否需要視覺**:

```typescript
async function getPageContext(smartDetection: boolean = true): Promise<PageContext> {
    if (!smartDetection) {
        // 強制使用視覺
        return await observePage();
    }

    // 智能檢測頁面是否有視覺元素
    const hasVisualContent = await detectVisualContent();

    if (hasVisualContent) {
        // 有圖片/圖表 → 使用 observePage()
        return await observePage();
    } else {
        // 純文字頁面 → 使用 getTabSelection()
        return { text: await getTabSelection() };
    }
}

async function detectVisualContent(): Promise<boolean> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            // 檢查是否有圖片
            const images = document.querySelectorAll('img[src]:not([width="1"]):not([height="1"])');
            if (images.length > 3) return true;

            // 檢查是否有 Canvas (圖表)
            const canvases = document.querySelectorAll('canvas');
            if (canvases.length > 0) return true;

            // 檢查是否有 SVG (圖表/圖標)
            const svgs = document.querySelectorAll('svg');
            if (svgs.length > 5) return true;

            // 檢查是否有複雜表格
            const tables = document.querySelectorAll('table');
            const complexTables = Array.from(tables).filter(t =>
                t.querySelectorAll('tr').length > 5
            );
            if (complexTables.length > 0) return true;

            return false;
        }
    });

    return result.result || false;
}
```

**優點**:
- ✅ 自動優化性能和成本
- ✅ 用戶無感知的智能增強
- ✅ 最佳用戶體驗
- ✅ 最佳 API 成本效益

**缺點**:
- 實現較複雜
- 檢測邏輯需要測試和優化

## 實現計劃

### 階段 1: 核心功能 (方案 3 - 智能混合)

#### 1.1 創建 `enhanced-observation.ts`

```typescript
// src/utils/enhanced-observation.ts

import { observePage, type Observation } from './browser-agent';
import { getTabSelection } from './tab-selection';

export interface PageContext {
    type: 'vision' | 'text';
    // Vision mode
    screenshot?: string;
    dom?: any;
    // Text mode
    text?: string;
    // Common
    url: string;
    title: string;
    timestamp: number;
}

export async function detectVisualContent(): Promise<boolean> {
    // 實現視覺內容檢測
}

export async function getEnhancedPageContext(
    forceVision: boolean = false
): Promise<PageContext> {
    if (forceVision || await detectVisualContent()) {
        const observation = await observePage();
        return {
            type: 'vision',
            screenshot: observation.screenshot,
            dom: observation.dom,
            url: observation.url,
            title: observation.title,
            timestamp: observation.timestamp
        };
    } else {
        const text = await getTabSelection();
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return {
            type: 'text',
            text,
            url: tab.url || '',
            title: tab.title || '',
            timestamp: Date.now()
        };
    }
}
```

#### 1.2 修改 `MacrosTab.tsx`

```typescript
// 修改 handlePromptClick 函數

const handlePromptClick = async (promptId: string) => {
    setIsProcessing(promptId);

    try {
        // 使用增強的頁面觀察 (智能檢測)
        const pageContext = await getEnhancedPageContext();

        const prompt = TEXT_PROMPTS.find(p => p.id === promptId);
        if (!prompt) return;

        let filledPrompt: string;

        if (pageContext.type === 'vision') {
            // Vision mode: 修改 prompt 以支持視覺分析
            filledPrompt = fillVisionPromptTemplate(
                prompt.template,
                pageContext
            );
        } else {
            // Text mode: 使用原有邏輯
            filledPrompt = fillPromptTemplate(
                prompt.template,
                pageContext.text,
                targetLanguage
            );
        }

        // 發送到 Chat
        await chrome.storage.local.set({
            pendingPromptExecution: {
                prompt: filledPrompt,
                promptTitle: prompt.title,
                pageContext: pageContext,  // 包含截圖和文字
                timestamp: Date.now()
            }
        });

        // ... rest of the code
    } catch (error) {
        console.error('[MacrosTab] Error:', error);
    } finally {
        setIsProcessing(null);
    }
};
```

#### 1.3 更新 Prompt 模板

```typescript
// src/utils/prompts.ts

export function fillVisionPromptTemplate(
    template: string,
    pageContext: PageContext,
    targetLanguage: string = 'English'
): string {
    // 提取文字內容 (從 DOM)
    const textContent = extractTextFromDOM(pageContext.dom);

    // 增強 prompt 以支持視覺分析
    const visionPrompt = `
You are viewing a webpage. I will provide you with:
1. A screenshot of the page (attached as image)
2. The text content extracted from the page

Please analyze BOTH the visual elements (images, charts, diagrams, layout)
and the text content to fulfill the following request:

${template.replace(PROMPT_PLACEHOLDER_TEXT, textContent)}

IMPORTANT:
- Pay attention to visual elements like charts, graphs, images, and diagrams
- Describe or reference visual content when relevant
- Consider the visual layout and structure of the page
- Please respond in ${targetLanguage}
`;

    return visionPrompt;
}

function extractTextFromDOM(domInfo: any): string {
    // 從 DOM 提取所有文字內容
    if (!domInfo || !domInfo.elements) return '';

    return domInfo.elements
        .map(el => el.text)
        .filter(text => text && text.length > 0)
        .join('\n');
}
```

#### 1.4 修改 Conversation 頁面以支持視覺內容

```typescript
// src/sidepanel/pages/conversation.tsx

// 在發送消息時檢查是否有 pageContext
useEffect(() => {
    const checkPendingExecution = async () => {
        const data = await chrome.storage.local.get('pendingPromptExecution');
        if (data.pendingPromptExecution) {
            const { prompt, pageContext } = data.pendingPromptExecution;

            if (pageContext?.type === 'vision') {
                // 發送 vision API 請求
                await sendVisionMessage(prompt, pageContext.screenshot);
            } else {
                // 發送普通文字請求
                await sendMessage(prompt);
            }

            await chrome.storage.local.remove('pendingPromptExecution');
        }
    };

    checkPendingExecution();
}, []);
```

### 階段 2: UI 增強

#### 2.1 添加視覺指示器

在 MacrosTab 中顯示是否使用了視覺分析：

```typescript
// 在 macro 按鈕上添加視覺指示
{TEXT_PROMPTS.map(prompt => (
    <button key={prompt.id} onClick={() => handlePromptClick(prompt.id)}>
        {/* ... */}
        {isVisionEnabled && (
            <span className="text-xs text-purple-600 flex items-center gap-1">
                👁️ Vision-enhanced
            </span>
        )}
    </button>
))}
```

#### 2.2 添加設置選項

在 Settings 頁面添加視覺功能開關：

```typescript
// Settings.tsx
<div className="setting-item">
    <label>
        <input
            type="checkbox"
            checked={settings.enableVisionMacros}
            onChange={(e) => onUpdate({ enableVisionMacros: e.target.checked })}
        />
        Enable Vision-Enhanced Macros
    </label>
    <p className="text-sm text-gray-500">
        Use page screenshots for better understanding (may increase API costs)
    </p>
</div>
```

### 階段 3: 新的視覺專用 Macros

添加專門利用視覺能力的新 macros：

```typescript
// src/utils/prompts.ts

export const VISION_PROMPTS: PromptTemplate[] = [
    {
        id: 'describe-images',
        title: 'Describe Images',
        description: 'Describe all images and diagrams on the page',
        icon: '🖼️',
        template: `Describe all the images, diagrams, charts, and visual elements visible on this page.
        For each visual element, describe:
        - What it shows
        - Its purpose or meaning
        - Any important details or data

        Please respond in ${PROMPT_PLACEHOLDER_LANG}.`,
        category: 'vision',
        forceVision: true
    },
    {
        id: 'analyze-layout',
        title: 'Analyze Layout',
        description: 'Analyze the visual layout and structure',
        icon: '📐',
        template: `Analyze the visual layout and structure of this page:
        - Main sections and their arrangement
        - Visual hierarchy
        - Design patterns used
        - Notable UI/UX elements

        Please respond in ${PROMPT_PLACEHOLDER_LANG}.`,
        category: 'vision',
        forceVision: true
    },
    {
        id: 'extract-data-visual',
        title: 'Extract Data from Charts',
        description: 'Extract data from charts and graphs',
        icon: '📊',
        template: `Extract and summarize the data shown in all charts, graphs, and tables on this page:
        - Chart type and purpose
        - Key data points and trends
        - Notable insights or patterns
        - Numerical values when visible

        Please respond in ${PROMPT_PLACEHOLDER_LANG}.`,
        category: 'vision',
        forceVision: true
    },
    {
        id: 'compare-screenshots',
        title: 'Compare Elements',
        description: 'Compare visual elements or sections',
        icon: '⚖️',
        template: `Compare the different visual elements or sections visible on this page:
        - Similarities and differences
        - Which sections stand out
        - Visual consistency or inconsistencies

        Please respond in ${PROMPT_PLACEHOLDER_LANG}.`,
        category: 'vision',
        forceVision: true
    }
];
```

## 性能和成本考慮

### API 成本對比

**Gemini API 定價** (假設):
- Text-only: ~$0.001 per request
- Vision (with image): ~$0.005 per request (5x)

**優化策略**:

1. **智能檢測** - 只在必要時使用視覺 (方案 3)
2. **截圖壓縮** - 降低圖片質量以減少 token 數
3. **用戶控制** - 允許用戶關閉視覺功能
4. **緩存** - 短時間內重複請求使用緩存

### 性能優化

```typescript
// 截圖壓縮
async function captureOptimizedScreenshot(quality: number = 60): Promise<string> {
    // 使用較低的 JPEG 質量
    await chrome.debugger.sendCommand(
        { tabId },
        'Page.captureScreenshot',
        {
            format: 'jpeg',
            quality: quality,  // 60% quality for macros
            captureBeyondViewport: true
        }
    );
}

// 緩存最近的觀察
const observationCache = new Map<string, {
    observation: Observation;
    timestamp: number;
}>();

async function getCachedObservation(tabId: number, maxAge: number = 5000): Promise<Observation | null> {
    const cached = observationCache.get(String(tabId));
    if (cached && (Date.now() - cached.timestamp) < maxAge) {
        return cached.observation;
    }
    return null;
}
```

## 測試計劃

### 測試場景

1. **純文字頁面** (Wikipedia)
   - 驗證不使用視覺 API
   - 響應時間 < 2 秒

2. **圖表密集頁面** (Google Analytics, 數據儀表板)
   - 驗證自動檢測視覺內容
   - 總結包含圖表數據

3. **技術文檔** (有架構圖)
   - 驗證解釋包含圖表參考
   - 架構圖被正確描述

4. **新聞文章** (有配圖)
   - 驗證圖片被描述
   - 總結包含圖片內容

5. **複雜表格頁面**
   - 驗證表格數據被提取
   - 結構被保留

### 回退測試

驗證當視覺功能失敗時，系統降級到純文字模式。

## 遷移指南

### 向後兼容

```typescript
// 確保現有功能不受影響
export async function getPageContextCompat(
    enableVision: boolean = true
): Promise<PageContext> {
    if (!enableVision) {
        // 完全降級到舊版本
        return {
            type: 'text',
            text: await getTabSelection(),
            url: '...',
            title: '...',
            timestamp: Date.now()
        };
    }

    try {
        return await getEnhancedPageContext();
    } catch (error) {
        console.error('Vision enhancement failed, falling back to text:', error);
        // 自動降級
        return {
            type: 'text',
            text: await getTabSelection(),
            url: '...',
            title: '...',
            timestamp: Date.now()
        };
    }
}
```

## 總結

### 改善對比

| 功能 | 當前 | 改善後 |
|------|------|--------|
| **Summarize** | 只能總結文字，遺失圖表 | 包含圖表、圖片的完整總結 |
| **Explain** | 無法參考視覺元素 | 可以解釋架構圖、流程圖等 |
| **頁面理解** | 純文字 (最多 3000 字) | 視覺 + 文字完整理解 |
| **數據分析** | 無法讀取圖表 | 可以提取圖表數據和趨勢 |
| **API 成本** | 低 | 智能優化，必要時才增加 |
| **響應速度** | 快 (1-2s) | 智能，純文字頁面仍然快 |

### 下一步行動

1. ✅ 分析現有限制 (完成)
2. ⏭️ 實現 `enhanced-observation.ts`
3. ⏭️ 修改 `MacrosTab.tsx`
4. ⏭️ 更新 prompt 模板
5. ⏭️ 測試和優化
6. ⏭️ 添加新的視覺專用 macros
