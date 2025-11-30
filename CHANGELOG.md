# Changelog

All notable changes to CPO TARS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-30

### Added - Vision-Enhanced Macros 🎉

#### Core Features
- **Smart Visual Detection System** (`src/utils/enhanced-observation.ts`)
  - Automatically detects when pages contain visual content (images, charts, diagrams)
  - Intelligently switches between TEXT mode (fast, 1-2s) and VISION mode (complete understanding, 2.5-3.5s)
  - Detects: large images (>50x50px), canvas elements, SVG graphics (>100x100px), complex tables, iframes

- **Vision-Enhanced Standard Macros**
  - 📝 Summarize - Now includes chart data and image content when detected
  - 💡 Explain - Can reference diagrams and architecture
  - ✍️ Rephrase - Context-aware with visual elements
  - ✅ Grammar Check - Fast text-only processing

- **New Vision-Specific Macros**
  - 📝 **Vision Summarize** - Comprehensive summary including all visual elements
  - 🖼️ **Describe Visuals** - Detailed descriptions of all images, charts, and diagrams
  - 📊 **Extract Chart Data** - Data extraction and analysis from graphs and charts

#### Browser Agent Integration
- **LLM-Powered Browser Control** (`src/utils/browser-agent.ts`)
  - Observe-Think-Act loop with Gemini 2.0 Flash
  - Full-page screenshot capture via CDP (Chrome DevTools Protocol)
  - Interactive element cataloging with temporary IDs
  - Smart action execution (click, type, scroll, navigate)

- **VLM Tab** (`src/sidepanel/components/BrowserAgentPanel.tsx`)
  - Visual browser automation interface
  - Real-time observation display
  - Action history tracking
  - Tab management capabilities

#### Technical Improvements
- **Message Channel Error Fix** (`src/background/index.ts`)
  - Added proper handler for EXECUTE_PROMPT messages
  - Fixed "message channel closed" error
  - Enhanced error logging and debugging

- **Enhanced Prompt System** (`src/utils/prompts.ts`)
  - Extended PromptTemplate interface with `forceVision` and `category: 'vision'`
  - Support for multimodal prompts (text + screenshot)
  - Smart prompt construction based on page context

### Changed
- **MacrosTab Complete Refactor** (`src/sidepanel/components/MacrosTab.tsx`)
  - Smart context detection (vision vs text)
  - Enhanced UI with visual indicators
  - Separated "Vision Analysis" section
  - Improved error handling with graceful degradation

- **Background Script Updates** (`src/background/index.ts`, `src/background/messages/execute-prompt.ts`)
  - Added support for pageContext parameter
  - Enhanced logging for vision mode detection
  - Improved async message handling

### Fixed
- Missing `category` property in TEXT_PROMPTS causing React component errors
- Message channel timeout errors in Chrome extension messaging
- CDP screenshot capture with proper debugger attachment/detachment

### Documentation
- ✅ `VISION-ENHANCED-MACROS.md` - Complete technical design document
- ✅ `VISION-MACROS-IMPLEMENTATION-COMPLETE.md` - Implementation guide with examples
- ✅ `VISION-MACROS-QUICK-GUIDE.md` - User quick start guide
- ✅ `MESSAGE-CHANNEL-FIX.md` - Error fix documentation
- ✅ `BROWSER-AGENT-USAGE.md` - Browser Agent usage guide
- ✅ `BROWSER-AGENT-INTEGRATION-COMPLETE.md` - Integration documentation
- ✅ `LLM-AGENT-BROWSER-INTERACTION.md` - Technical research document

### Known Issues ⚠️

#### Visual Features - Needs Improvement
The vision-enhanced macros feature is **functionally complete** but has some issues that need to be addressed:

1. **UI Display Issues**
   - React component rendering errors in console (fixed but needs testing)
   - Visual indicators may not display correctly on first load
   - Requires extension reload after updates

2. **Performance Optimization Needed**
   - Screenshot capture can be slow on very large pages
   - No caching mechanism for repeated observations
   - Vision API calls not optimized for cost

3. **Error Handling**
   - Need better user feedback when vision detection fails
   - Fallback to text mode could be more transparent
   - CDP debugger conflicts with DevTools not clearly communicated

4. **Testing Required**
   - Vision mode detection accuracy needs validation on diverse pages
   - Chart data extraction accuracy varies by chart type
   - Complex visual layouts may not be fully understood

5. **Future Enhancements**
   - Add user toggle for vision mode (force on/off)
   - Show mode indicator in UI (TEXT/VISION badge)
   - Implement observation caching for performance
   - Add more vision-specific macro templates
   - Better error messages and recovery strategies

### Migration Notes
- Users need to reload the extension after update
- Gemini API key configuration required in Settings tab
- No breaking changes to existing macros functionality
- All previous text-only macros continue to work as before

### Performance Impact
- TEXT mode pages: No performance impact (same as before)
- VISION mode pages: ~1-2 seconds additional processing time
- API costs: 2-2.5x increase only when vision mode is used (automatic optimization)

---

## [0.0.1] - 2025-11-28

### Initial Release
- Basic translation functionality
- Prompt macros (Summarize, Explain, Rephrase, Grammar Check)
- Settings tab with language preferences
- Chat interface with Gemini AI
- Chrome extension sidepanel
- Gemini API integration
