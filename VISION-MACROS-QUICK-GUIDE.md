# Vision-Enhanced Macros 快速指南 🚀

## TL;DR (太長不看版)

✅ **Macros 現在可以"看到"網頁了！**

- 所有 macros 自動獲得視覺能力
- 頁面有圖表/圖片時自動使用視覺分析
- 純文字頁面保持快速
- 新增 3 個視覺專用 macros

## 快速開始

### 1. 測試標準 Macros (自動視覺增強)

**在純文字頁面** (例如 Wikipedia):
```
1. 打開 CPO TARS → Macros tab
2. 點擊 "📝 Summarize"
3. 快速完成 (~1-2秒)
4. 使用 TEXT mode
```

**在帶圖表的頁面** (例如 Google Analytics):
```
1. 打開帶有圖表的頁面
2. 點擊 "📝 Summarize"
3. 自動檢測到視覺內容
4. 使用 VISION mode (~2-3秒)
5. 總結包含圖表數據！✨
```

### 2. 測試視覺專用 Macros

在 Macros tab 向下滾動，你會看到 "👁️ Vision Analysis" 區塊:

- **📝 Vision Summarize** - 總結包含所有視覺元素
- **🖼️ Describe Visuals** - 描述所有圖片和圖表
- **📊 Extract Chart Data** - 提取圖表中的數據

這些 macros **總是使用視覺分析**，即使在純文字頁面。

## 使用場景

### ✅ 適合使用視覺 Macros 的頁面:

1. **數據儀表板**
   - Google Analytics
   - 任何包含圖表的頁面
   - 使用 "📊 Extract Chart Data"

2. **技術文檔**
   - 包含架構圖、流程圖
   - UML 圖、系統設計圖
   - 使用 "💡 Explain" 或 "📝 Vision Summarize"

3. **產品頁面**
   - 有產品圖片
   - 功能截圖
   - 使用 "🖼️ Describe Visuals"

4. **新聞/文章**
   - 配有圖片、圖表
   - 信息圖表
   - 使用 "📝 Summarize" (自動增強)

5. **報告頁面**
   - 財務報告
   - 研究報告
   - 使用 "📝 Vision Summarize"

### ⚡ 純文字頁面 (保持快速):

1. Wikipedia 文章
2. Blog 文章 (只有文字)
3. 論文 (arXiv)
4. 純文檔頁面

→ 自動使用 TEXT mode，保持快速！

## 視覺能力範例

### Before vs After

**場景: 總結包含圖表的技術文章**

❌ **Before** (只有文字):
```
"The article discusses API performance.
Figure 1 shows latency metrics.
Table 2 indicates throughput results."

→ 看不到 Figure 1 和 Table 2
→ 總結不完整
```

✅ **After** (Vision-enhanced):
```
"The article analyzes API performance with comprehensive metrics:

Latency (Figure 1 - Line Chart):
- Baseline: 45ms average
- Optimized: 12ms average (73% improvement)
- 95th percentile: 28ms

Throughput (Table 2):
- HTTP/1.1: 1,250 req/s
- HTTP/2: 3,800 req/s (3x improvement)
- HTTP/3: 4,200 req/s (3.4x improvement)

Key insights: The optimization significantly reduced
latency while HTTP/3 provides the best throughput."
```

## 視覺指示器

**在 Macros UI 中**:

- 標準 macros: "👁️ Vision-enhanced when page has visuals"
- Vision macros: "🔍 Always uses vision analysis"

**在 Console 中** (開發者工具):
```
[MacrosTab] Using VISION mode for prompt: summarize
[MacrosTab] Using TEXT mode for prompt: grammar
```

## 智能檢測

系統會自動檢測這些視覺內容:

✅ 圖片 (>50x50 px, 超過 2 張)
✅ Canvas 元素 (圖表庫如 Chart.js, D3.js)
✅ SVG 圖形 (>100x100 px)
✅ 複雜表格 (>5 rows 或 >4 cols)
✅ iframe 嵌入 (影片, charts, embedded content)

❌ 排除:
- 小圖示 (<50px)
- Tracking pixels (1x1)
- 純 logo 頁面

## 性能和成本

### 性能

| 模式 | 頁面類型 | 速度 | 範例 |
|------|----------|------|------|
| TEXT | 純文字 | ~1-2s ⚡ | Wikipedia |
| VISION | 視覺頁面 | ~2.5-3.5s ✅ | Google Analytics |

### API 成本

假設 100 次使用:
- 70% 純文字頁面 → TEXT mode
- 30% 視覺頁面 → VISION mode

**成本**: ~2.2x (但獲得完整視覺理解！)

## 常見問題

### Q: 如何知道使用了哪種模式？

**A:** 打開瀏覽器 console (F12) 查看日誌:
```
[MacrosTab] Using VISION mode for prompt: summarize
```

### Q: 可以強制使用/不使用視覺嗎？

**A:** 目前:
- 標準 macros (Summarize, Explain 等) - 自動智能檢測
- Vision macros (Vision Summarize, Describe Visuals 等) - 總是使用視覺

未來可能添加用戶設置來控制。

### Q: 視覺分析會更慢嗎？

**A:**
- 純文字頁面: 不會，仍然快速 (~1-2s)
- 視覺頁面: 稍慢 (~2.5-3.5s)，但獲得完整理解
- 智能檢測確保只在必要時使用

### Q: API 成本會增加多少？

**A:** 大約 2-2.5x，但只有在使用 vision mode 時:
- Text mode: ~$0.001 per request
- Vision mode: ~$0.005 per request

系統會智能優化，純文字頁面不增加成本。

### Q: 哪些頁面會使用視覺分析？

**A:** 系統自動檢測包含以下內容的頁面:
- 圖片 (產品頁面, 新聞)
- 圖表 (儀表板, 報告)
- SVG 圖形 (技術文檔)
- 複雜表格 (數據頁面)
- Canvas (圖表庫)

### Q: 如果視覺分析失敗會怎樣？

**A:** 自動降級到 TEXT mode:
```typescript
try {
    return await getEnhancedPageContext();
} catch (error) {
    // 自動降級
    return { type: 'text', text: await getTabSelection() };
}
```

不會中斷功能！

## 測試清單

建議按順序測試:

- [ ] 1. 純文字頁面 (Wikipedia) - "Summarize"
  - 應該快速 (~1-2s)
  - Console: "Using TEXT mode"

- [ ] 2. 帶圖片的新聞文章 - "Summarize"
  - 自動檢測視覺內容
  - Console: "Using VISION mode"
  - 總結提到圖片內容

- [ ] 3. 數據儀表板 (Google Analytics) - "📊 Extract Chart Data"
  - 使用 Vision macro
  - 提取圖表數據和趨勢

- [ ] 4. 技術文檔 (有架構圖) - "💡 Explain"
  - 自動使用 VISION mode
  - 解釋參考圖形

- [ ] 5. "🖼️ Describe Visuals" 在任何頁面
  - 描述所有視覺元素
  - 即使是純文字頁面也會分析

## 相關文檔

- `VISION-ENHANCED-MACROS.md` - 完整設計文檔
- `VISION-MACROS-IMPLEMENTATION-COMPLETE.md` - 實施詳情
- `BROWSER-AGENT-USAGE.md` - Browser Agent 使用指南
- `LLM-AGENT-BROWSER-INTERACTION.md` - 技術研究

## 故障排除

### 問題: Macro 一直顯示 "Processing..."

**解決**:
1. 檢查 Gemini API key 是否配置 (Settings tab)
2. 檢查 console 是否有錯誤
3. 嘗試簡單頁面 (Wikipedia)

### 問題: 看不到視覺分析結果

**檢查**:
1. 頁面是否真的有視覺內容?
2. Console 顯示使用哪種模式?
3. 嘗試使用 Vision Summarize (強制 vision mode)

### 問題: 速度太慢

**原因可能**:
1. 頁面非常大/複雜
2. 網絡延遲
3. API 響應慢

**優化**:
- 在小頁面測試
- 檢查網絡連接
- 考慮使用 TEXT-only macros 如果不需要視覺

## 開始使用！

1. 打開 CPO TARS extension
2. 前往 **Macros** tab
3. 嘗試在不同類型的頁面使用 macros
4. 查看 "👁️ Vision Analysis" 區塊的新功能

**享受更強大的頁面理解能力！** 🎉
