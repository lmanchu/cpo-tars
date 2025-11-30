/**
 * Browser Agent - LLM 控制的瀏覽器自動化
 *
 * 讓 Gemini 能夠:
 * 1. 觀察網頁 (截圖 + DOM)
 * 2. 理解任務並決策
 * 3. 執行操作 (點擊、輸入、滾動等)
 * 4. 循環直到任務完成
 */

import { capturePageScreenshot } from './tab-selection';
import { Storage } from "@plasmohq/storage";

// ========== 類型定義 ==========

export interface InteractiveElement {
    id: number;
    tag: string;
    type: string;
    text: string;
    placeholder: string;
    href: string;
    value: string;
    ariaLabel: string;
    rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface DOMInfo {
    url: string;
    title: string;
    elements: InteractiveElement[];
    viewport: {
        width: number;
        height: number;
        scrollX: number;
        scrollY: number;
    };
}

export interface Observation {
    screenshot: string;
    dom: DOMInfo;
    url: string;
    title: string;
    timestamp: number;
}

export interface Action {
    type: 'click' | 'type' | 'scroll' | 'wait' | 'navigate' | 'done';
    params: any;
    thought?: string;
    reason?: string;
}

export interface AgentStep {
    stepNumber: number;
    observation: Observation;
    action: Action;
    timestamp: number;
}

// ========== DOM 提取 ==========

/**
 * 提取頁面中可互動的元素
 * 在目標 tab 中執行,返回簡化的 DOM 結構
 */
export async function extractInteractiveElements(tabId: number): Promise<DOMInfo> {
    const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
            const elements: InteractiveElement[] = [];
            let id = 0;

            // 選擇器: 所有可互動元素
            const selectors = [
                'a[href]',
                'button',
                'input',
                'textarea',
                'select',
                '[role="button"]',
                '[role="link"]',
                '[role="textbox"]',
                '[onclick]',
                '[contenteditable="true"]'
            ];

            const interactiveElements = document.querySelectorAll(selectors.join(', '));

            interactiveElements.forEach(el => {
                // 過濾不可見元素
                const rect = el.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) return;

                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

                // 檢查是否在視窗範圍內或附近 (允許少量超出以便滾動)
                if (rect.bottom < -500 || rect.top > window.innerHeight + 500) return;

                // 添加臨時標記以便後續操作
                el.setAttribute('data-agent-id', String(id));

                const element: InteractiveElement = {
                    id: id++,
                    tag: el.tagName.toLowerCase(),
                    type: (el as HTMLInputElement).type || '',
                    text: el.textContent?.trim().substring(0, 100) || '',
                    placeholder: (el as HTMLInputElement).placeholder || '',
                    href: (el as HTMLAnchorElement).href || '',
                    value: (el as HTMLInputElement).value || '',
                    ariaLabel: el.getAttribute('aria-label') || '',
                    rect: {
                        x: Math.round(rect.x),
                        y: Math.round(rect.y),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height)
                    }
                };

                elements.push(element);
            });

            return {
                url: window.location.href,
                title: document.title,
                elements,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    scrollX: window.scrollX,
                    scrollY: window.scrollY
                }
            };
        }
    });

    return result.result as DOMInfo;
}

// ========== 頁面觀察 ==========

/**
 * 觀察當前頁面狀態
 * 混合方案: 截圖 + DOM
 */
export async function observePage(): Promise<Observation> {
    console.log('[BrowserAgent] Observing page...');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
        throw new Error('No active tab found');
    }

    // 並行獲取截圖和 DOM
    const [screenshot, domInfo] = await Promise.all([
        capturePageScreenshot(),
        extractInteractiveElements(tab.id)
    ]);

    if (!screenshot) {
        throw new Error('Failed to capture screenshot');
    }

    return {
        screenshot,
        dom: domInfo,
        url: domInfo.url,
        title: domInfo.title,
        timestamp: Date.now()
    };
}

// ========== 操作執行 ==========

/**
 * 點擊元素 (通過 ID)
 */
export async function clickElement(elementId: number): Promise<void> {
    console.log('[BrowserAgent] Clicking element:', elementId);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) throw new Error('No active tab');

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (id: number) => {
            const el = document.querySelector(`[data-agent-id="${id}"]`);
            if (el instanceof HTMLElement) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                    el.click();
                    console.log('[BrowserAgent] Element clicked:', el);
                }, 500);
            } else {
                console.error('[BrowserAgent] Element not found:', id);
            }
        },
        args: [elementId]
    });
}

/**
 * 點擊坐標
 */
export async function clickCoordinate(x: number, y: number): Promise<void> {
    console.log('[BrowserAgent] Clicking coordinate:', x, y);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) throw new Error('No active tab');

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (x: number, y: number) => {
            const el = document.elementFromPoint(x, y);
            if (el instanceof HTMLElement) {
                el.click();
                console.log('[BrowserAgent] Clicked element at:', x, y, el);
            }
        },
        args: [x, y]
    });
}

/**
 * 在輸入框輸入文字
 */
export async function typeText(elementId: number, text: string): Promise<void> {
    console.log('[BrowserAgent] Typing text:', elementId, text);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) throw new Error('No active tab');

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (id: number, text: string) => {
            const el = document.querySelector(`[data-agent-id="${id}"]`);
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                // 先聚焦
                el.focus();
                // 清空現有內容
                el.value = '';
                // 逐字輸入模擬真實打字
                let currentValue = '';
                const chars = text.split('');

                chars.forEach((char, i) => {
                    setTimeout(() => {
                        currentValue += char;
                        el.value = currentValue;
                        el.dispatchEvent(new Event('input', { bubbles: true }));

                        if (i === chars.length - 1) {
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }, i * 50);
                });

                console.log('[BrowserAgent] Typed:', text);
            } else if (el?.hasAttribute('contenteditable')) {
                (el as HTMLElement).textContent = text;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }
        },
        args: [elementId, text]
    });

    // 等待輸入完成
    await new Promise(resolve => setTimeout(resolve, text.length * 50 + 500));
}

/**
 * 滾動頁面
 */
export async function scrollPage(direction: 'up' | 'down' | 'top' | 'bottom', amount?: number): Promise<void> {
    console.log('[BrowserAgent] Scrolling:', direction, amount);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) throw new Error('No active tab');

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (direction: string, amount?: number) => {
            let scrollAmount = amount || window.innerHeight;

            switch (direction) {
                case 'up':
                    window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
                    break;
                case 'down':
                    window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
                    break;
                case 'top':
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    break;
                case 'bottom':
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    break;
            }
        },
        args: [direction, amount]
    });

    // 等待滾動完成
    await new Promise(resolve => setTimeout(resolve, 1000));
}

/**
 * 執行操作
 */
export async function executeAction(action: Action): Promise<void> {
    console.log('[BrowserAgent] Executing action:', action.type, action.params);

    switch (action.type) {
        case 'click':
            if (action.params.elementId !== undefined) {
                await clickElement(action.params.elementId);
            } else if (action.params.x !== undefined && action.params.y !== undefined) {
                await clickCoordinate(action.params.x, action.params.y);
            }
            break;

        case 'type':
            await typeText(action.params.elementId, action.params.text);
            break;

        case 'scroll':
            await scrollPage(
                action.params.direction,
                action.params.amount
            );
            break;

        case 'wait':
            await new Promise(resolve => setTimeout(resolve, action.params.ms || 1000));
            break;

        case 'navigate':
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab.id) {
                await chrome.tabs.update(tab.id, { url: action.params.url });
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            break;

        case 'done':
            console.log('[BrowserAgent] Task completed:', action.params.result);
            break;

        default:
            console.warn('[BrowserAgent] Unknown action type:', action.type);
    }
}

// ========== LLM 決策 ==========

/**
 * 構建給 LLM 的 prompt
 */
export function buildAgentPrompt(
    task: string,
    observation: Observation,
    history: AgentStep[]
): string {
    const elementsDescription = observation.dom.elements
        .slice(0, 50) // 限制數量避免 token 過多
        .map(el => {
            let desc = `[${el.id}] ${el.tag}`;
            if (el.type) desc += `[type=${el.type}]`;
            if (el.text) desc += `: "${el.text}"`;
            if (el.placeholder) desc += ` placeholder="${el.placeholder}"`;
            if (el.href) desc += ` href="${el.href}"`;
            if (el.ariaLabel) desc += ` aria-label="${el.ariaLabel}"`;
            desc += ` at (${el.rect.x}, ${el.rect.y})`;
            return desc;
        })
        .join('\n');

    const historyDescription = history
        .map((step, i) => {
            const action = step.action;
            return `${i + 1}. ${action.thought || ''}\n   Action: ${action.type}(${JSON.stringify(action.params)})`;
        })
        .join('\n\n');

    return `你是一個瀏覽器自動化 agent。你的任務是: ${task}

當前頁面資訊:
- URL: ${observation.url}
- 標題: ${observation.title}
- 視窗大小: ${observation.dom.viewport.width}x${observation.dom.viewport.height}
- 滾動位置: (${observation.dom.viewport.scrollX}, ${observation.dom.viewport.scrollY})

可互動元素 (ID 對應截圖中的位置):
${elementsDescription}

${history.length > 0 ? `歷史操作 (${history.length} 步):\n${historyDescription}\n` : ''}

請分析截圖和元素列表,決定下一步操作。

可用操作:
1. click(elementId: number) - 點擊指定元素 (優先使用)
2. click(x: number, y: number) - 點擊坐標 (當元素 ID 不可用時)
3. type(elementId: number, text: string) - 在輸入框輸入文字
4. scroll(direction: "up"|"down"|"top"|"bottom", amount?: number) - 滾動頁面
5. wait(ms: number) - 等待指定毫秒
6. navigate(url: string) - 導航到新 URL
7. done(result: string) - 任務完成,返回結果

重要指示:
- 優先使用元素 ID 而非坐標點擊
- 每次只執行一個操作
- 如果找不到目標元素,考慮滾動頁面
- 輸入文字後通常需要點擊提交按鈕或按 Enter
- 等待頁面載入或動畫完成時使用 wait
- 任務完成時必須使用 done 操作

請以 JSON 格式回應 (只回傳 JSON,不要其他文字):
{
    "thought": "你的思考過程,分析當前狀況和決策理由",
    "action": "操作類型",
    "params": { "參數" },
    "reason": "為什麼執行這個操作"
}

範例回應:
{
    "thought": "我看到一個搜尋框 (元素 ID 5),我應該在裡面輸入搜尋關鍵字",
    "action": "type",
    "params": { "elementId": 5, "text": "Gemini API" },
    "reason": "需要在搜尋框輸入查詢內容"
}`;
}

/**
 * 解析 LLM 回應
 */
export function parseAgentResponse(response: string): Action {
    try {
        // 嘗試提取 JSON (有時 LLM 會包含額外文字)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const action = JSON.parse(jsonMatch[0]);

        // 驗證必要欄位
        if (!action.action || !action.params) {
            throw new Error('Invalid action format');
        }

        return {
            type: action.action,
            params: action.params,
            thought: action.thought,
            reason: action.reason
        };
    } catch (error) {
        console.error('[BrowserAgent] Failed to parse LLM response:', error);
        console.error('Response was:', response);
        throw new Error(`Failed to parse LLM response: ${error.message}`);
    }
}

// ========== Agent 主循環 ==========

/**
 * 執行瀏覽器 Agent 任務
 */
export async function runBrowserAgent(
    task: string,
    maxSteps: number = 20,
    onProgress?: (step: AgentStep) => void
): Promise<string> {
    console.log('[BrowserAgent] Starting task:', task);

    const storage = new Storage();
    const history: AgentStep[] = [];

    for (let stepNumber = 1; stepNumber <= maxSteps; stepNumber++) {
        console.log(`[BrowserAgent] Step ${stepNumber}/${maxSteps}`);

        try {
            // 1. 觀察當前頁面
            const observation = await observePage();

            // 2. 構建 prompt
            const prompt = buildAgentPrompt(task, observation, history);

            // 3. 獲取 Gemini API key
            const userSettings = await storage.get<any>('userSettings');
            const apiKey = userSettings?.geminiApiKey;

            if (!apiKey) {
                throw new Error('Gemini API key not configured');
            }

            // 4. 調用 Gemini 決策
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    { text: prompt },
                                    {
                                        inline_data: {
                                            mime_type: 'image/png',
                                            data: observation.screenshot
                                        }
                                    }
                                ]
                            }
                        ],
                        generationConfig: {
                            temperature: 0.2,
                            maxOutputTokens: 1000
                        }
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const result = await response.json();
            const llmResponse = result.candidates[0].content.parts[0].text;

            console.log('[BrowserAgent] LLM response:', llmResponse);

            // 5. 解析決策
            const action = parseAgentResponse(llmResponse);

            // 6. 記錄步驟
            const step: AgentStep = {
                stepNumber,
                observation,
                action,
                timestamp: Date.now()
            };

            history.push(step);

            // 7. 回調進度
            if (onProgress) {
                onProgress(step);
            }

            console.log(`[BrowserAgent] Thought: ${action.thought}`);
            console.log(`[BrowserAgent] Action: ${action.type}`, action.params);

            // 8. 檢查是否完成
            if (action.type === 'done') {
                console.log('[BrowserAgent] Task completed successfully!');
                return action.params.result || 'Task completed';
            }

            // 9. 執行操作
            await executeAction(action);

            // 10. 等待頁面穩定
            await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (error) {
            console.error(`[BrowserAgent] Error at step ${stepNumber}:`, error);
            throw error;
        }
    }

    throw new Error(`Reached maximum steps (${maxSteps}) without completion`);
}
