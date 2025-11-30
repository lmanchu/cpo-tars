// 快速檢查 QuickPromptButtons 的腳本
// 在 Chrome DevTools Console 中執行此腳本

console.log('🔍 開始檢查 QuickPromptButtons...\n');

// 1. 檢查按鈕容器
const buttonContainer = document.querySelector('.px-3.py-2.bg-white.border-b.border-gray-100');
console.log('✓ 按鈕容器:', buttonContainer ? '找到' : '未找到');
if (buttonContainer) {
    const style = window.getComputedStyle(buttonContainer);
    console.log('  - display:', style.display);
    console.log('  - visibility:', style.visibility);
    console.log('  - opacity:', style.opacity);
    console.log('  - height:', style.height);
    console.log('  - HTML:', buttonContainer.innerHTML.substring(0, 200));
}

// 2. 檢查所有按鈕
const allButtons = document.querySelectorAll('button');
console.log('\n✓ 頁面上的按鈕總數:', allButtons.length);

// 3. 尋找 emoji 按鈕
const emojiButtons = Array.from(allButtons).filter(btn =>
    btn.textContent.match(/[📝💡✍️✅]/)
);
console.log('✓ Emoji 按鈕數量:', emojiButtons.length);
if (emojiButtons.length > 0) {
    console.log('  找到的 emoji 按鈕:');
    emojiButtons.forEach((btn, i) => {
        const style = window.getComputedStyle(btn);
        console.log(`  ${i + 1}. ${btn.textContent} - visible: ${style.display !== 'none' && style.visibility !== 'hidden'}`);
    });
} else {
    console.log('  ❌ 未找到任何 emoji 按鈕');
}

// 4. 檢查 Chat 布局
const chatList = document.querySelector('[class*="chatList"]');
const mainInputArea = document.querySelector('[class*="mainInputArea"]');
console.log('\n✓ Chat 列表:', chatList ? '找到' : '未找到');
console.log('✓ 輸入區域:', mainInputArea ? '找到' : '未找到');

// 5. 檢查按鈕應該在的位置
if (chatList && mainInputArea) {
    let current = chatList.nextElementSibling;
    let count = 0;
    console.log('\n✓ Chat 列表和輸入區域之間的元素:');
    while (current && current !== mainInputArea && count < 10) {
        console.log(`  ${count + 1}.`, current.className.substring(0, 80));
        if (current.textContent.match(/[📝💡✍️✅]/)) {
            console.log('     ^ 這個元素包含 emoji!');
        }
        current = current.nextElementSibling;
        count++;
    }
    if (count === 0) {
        console.log('  ⚠️ 沒有元素(按鈕可能應該在這裡!)');
    }
}

// 6. 檢查 React 錯誤
console.log('\n✓ 檢查 Console 是否有 React 錯誤:');
console.log('  (請查看 Console 的 Errors 標籤)');

// 7. 總結
console.log('\n========== 總結 ==========');
if (emojiButtons.length === 4) {
    console.log('✅ 找到 4 個 emoji 按鈕 - 功能正常!');
} else if (emojiButtons.length > 0) {
    console.log(`⚠️ 找到 ${emojiButtons.length} 個 emoji 按鈕(應該是 4 個)`);
} else {
    console.log('❌ 未找到 emoji 按鈕 - 可能有問題');
    console.log('\n可能的原因:');
    console.log('1. 按鈕容器沒有渲染');
    console.log('2. CSS 隱藏了按鈕');
    console.log('3. React 渲染錯誤');
    console.log('4. 需要滾動才能看到');
}
console.log('==========================\n');
