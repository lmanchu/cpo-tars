# QuickPromptButtons 診斷指南

## 問題:快速提示按鈕不可見

從您的截圖中,我看到 CPO TARS 側邊欄已打開,但是快速提示按鈕(📝💡✍️✅)沒有顯示。

## 診斷步驟

### 步驟 1: 檢查按鈕是否在 DOM 中

請在**瀏覽器控制台**中執行以下命令:

```javascript
// 檢查 QuickPromptButtons 容器是否存在
const buttonContainer = document.querySelector('.px-3.py-2.bg-white.border-b.border-gray-100');
console.log('Button container found:', buttonContainer);

// 檢查所有 button 元素
const buttons = document.querySelectorAll('button');
console.log('Total buttons:', buttons.length);
Array.from(buttons).forEach((btn, i) => {
    console.log(`Button ${i}:`, btn.textContent, btn.className);
});

// 檢查是否有emoji按鈕
const emojiButtons = Array.from(buttons).filter(btn =>
    btn.textContent.includes('📝') ||
    btn.textContent.includes('💡') ||
    btn.textContent.includes('✍️') ||
    btn.textContent.includes('✅')
);
console.log('Emoji buttons found:', emojiButtons.length, emojiButtons);
```

### 步驟 2: 檢查 React 組件渲染

```javascript
// 檢查 MessageList 和輸入區域之間的元素
const chatList = document.querySelector('[class*="chatList"]');
const mainInputArea = document.querySelector('[class*="mainInputArea"]');
console.log('Chat list:', chatList);
console.log('Input area:', mainInputArea);

// 檢查它們之間是否有 QuickPromptButtons
if (chatList && mainInputArea) {
    const betweenElements = [];
    let current = chatList.nextElementSibling;
    while (current && current !== mainInputArea) {
        betweenElements.push(current);
        current = current.nextElementSibling;
    }
    console.log('Elements between chatList and inputArea:', betweenElements);
}
```

### 步驟 3: 檢查 CSS 可見性

```javascript
// 檢查所有隱藏的元素
const allDivs = document.querySelectorAll('div');
const hiddenDivs = Array.from(allDivs).filter(div => {
    const style = window.getComputedStyle(div);
    return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
});
console.log('Hidden divs:', hiddenDivs.length);

// 特別檢查帶有 border-gray-100 的元素
const borderGrayDivs = document.querySelectorAll('.border-gray-100');
console.log('Border-gray-100 divs:', borderGrayDivs);
Array.from(borderGrayDivs).forEach((div, i) => {
    const style = window.getComputedStyle(div);
    console.log(`Div ${i}:`, {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        height: style.height,
        innerHTML: div.innerHTML.substring(0, 100)
    });
});
```

## 可能的原因與解決方案

### 原因 1: 按鈕被滾動隱藏

**症狀:** 按鈕存在於 DOM 中,但在視窗外

**解決方法:**
1. 在 Chat 標籤頁中**向上滾動**
2. 查看訊息列表和輸入框之間的區域

### 原因 2: CSS 樣式問題

**症狀:** 按鈕元素存在但 display: none 或 visibility: hidden

**解決方法:**
在控制台執行:
```javascript
// 強制顯示按鈕(如果存在)
const buttonContainer = document.querySelector('.px-3.py-2.bg-white.border-b.border-gray-100');
if (buttonContainer) {
    buttonContainer.style.display = 'block';
    buttonContainer.style.visibility = 'visible';
    buttonContainer.style.opacity = '1';
    buttonContainer.style.height = 'auto';
    console.log('Forced button container visible');
}
```

### 原因 3: React 渲染錯誤

**症狀:** Console 中有 React 錯誤訊息

**解決方法:**
1. 查看瀏覽器 Console 的 Errors 標籤
2. 尋找與 "QuickPromptButtons" 或 "TEXT_PROMPTS" 相關的錯誤
3. 重新載入擴充功能

### 原因 4: 條件渲染問題

**症狀:** 按鈕根本不在 DOM 中

**檢查:**
```javascript
// 檢查 TEXT_PROMPTS 是否被正確導入
console.log('Checking window object for prompts...');
// (這個在頁面上下文中可能無法直接訪問,但可以從 React DevTools 查看)
```

## 緊急修復:手動添加按鈕測試

如果以上診斷都無法解決,您可以在控制台手動創建測試按鈕:

```javascript
// 手動創建快速提示按鈕用於測試
const createTestButtons = () => {
    const inputArea = document.querySelector('[class*="mainInputArea"]');
    if (!inputArea) {
        console.error('Input area not found');
        return;
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'px-3 py-2 bg-white border-b border-gray-100';
    buttonContainer.style.cssText = 'padding: 8px 12px; background: white; border-bottom: 1px solid #E5E7EB;';

    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'flex gap-2 items-center justify-center';
    buttonWrapper.style.cssText = 'display: flex; gap: 8px; align-items: center; justify-content: center;';

    const prompts = [
        { id: 'summarize', emoji: '📝', title: 'Summarize' },
        { id: 'explain', emoji: '💡', title: 'Explain' },
        { id: 'rephrase', emoji: '✍️', title: 'Rephrase' },
        { id: 'grammar', emoji: '✅', title: 'Grammar Check' }
    ];

    prompts.forEach(prompt => {
        const btn = document.createElement('button');
        btn.textContent = prompt.emoji;
        btn.title = prompt.title;
        btn.style.cssText = `
            width: 32px;
            height: 32px;
            font-size: 20px;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            background: white;
        `;
        btn.onmouseover = () => {
            btn.style.borderColor = '#3B82F6';
            btn.style.background = '#EFF6FF';
        };
        btn.onmouseout = () => {
            btn.style.borderColor = '#E5E7EB';
            btn.style.background = 'white';
        };
        btn.onclick = () => {
            console.log('Test button clicked:', prompt.id);
            alert(`Clicked: ${prompt.title}\nThis will trigger screenshot capture in the real implementation.`);
        };
        buttonWrapper.appendChild(btn);
    });

    buttonContainer.appendChild(buttonWrapper);
    inputArea.parentNode.insertBefore(buttonContainer, inputArea);
    console.log('✅ Test buttons created successfully!');
};

createTestButtons();
```

## 下一步

執行完診斷後,請回報:

1. **Step 1 結果**: 按鈕是否在 DOM 中?
2. **Step 2 結果**: 按鈕容器的位置在哪裡?
3. **Step 3 結果**: 是否有 CSS 隱藏問題?
4. **Console 錯誤**: 複製所有與 QuickPromptButtons 或 React 相關的錯誤

這些信息將幫助我們快速定位問題並修復!
