# CPO TARS Full-Page Screenshot Testing Guide

## Status: CDP Implementation Complete ✅

The full-page screenshot feature using Chrome DevTools Protocol (CDP) is now fully implemented and compiled. This guide will help you test the end-to-end VLM (Vision Language Model) integration.

## What's Been Fixed

1. ✅ CDP implementation with `Page.captureScreenshot` + `captureBeyondViewport: true`
2. ✅ IIFE wrapper for async message handling to prevent channel closure
3. ✅ safeSendResponse guard to prevent duplicate responses
4. ✅ Restricted page detection with helpful error messages
5. ✅ Comprehensive error handling and logging
6. ✅ All changes compiled to `build/chrome-mv3-dev/static/background/index.js`

## Prerequisites

Before testing, ensure:
- [ ] Extension is loaded in Chrome from `build/chrome-mv3-dev/` directory
- [ ] Gemini API key is configured in settings
- [ ] Extension icon shows in browser toolbar
- [ ] No DevTools attached to test tabs (CDP requires exclusive debugger access)

## Testing Steps

### Step 1: Load Extension (Fresh Start)

```bash
# In CPO TARS directory
pnpm run dev

# or if already running, just reload the extension:
# Go to chrome://extensions
# Click reload button for CPO TARS
```

### Step 2: Navigate to Test Page

Open the test page created specifically for screenshot testing:
```
file:///Users/lman/gemini/CPO-tars/test-screenshot.html
```

This page has:
- Long scrollable content (2000px height)
- Multiple visual markers (MARKER 1, 2, 3, 4)
- Testing instructions
- Common issues troubleshooting

### Step 3: Open Sidepanel

1. Click the CPO TARS extension icon in toolbar
2. Sidepanel should open on the right side
3. Go to the "Chat" tab

### Step 4: Locate Quick Prompt Buttons

**IMPORTANT**: The Quick Prompt Buttons should appear **above the input box**, between the message list and the "Enter message..." input field.

Look for these buttons:
- 📝 **Summarize** - "Summarize the content"
- 💡 **Explain** - "Explain the content"
- ✍️ **Rephrase** - "Rephrase the content"
- ✅ **Grammar** - "Check grammar and improve"

**If you don't see them:**
- Scroll up in the Chat tab
- Make sure you're on the Chat tab (not Settings)
- Check browser console for errors

### Step 5: Test Screenshot Capture

1. **Click one of the quick prompt buttons** (e.g., 📝 Summarize)
2. **Watch the browser console** for these log messages:

```
[QuickPromptButtons] Button clicked: summarize
[QuickPromptButtons] Capturing page screenshot...
[Background] Received message: CAPTURE_SCREENSHOT
[Background] Starting full-page screenshot capture...
[Background] Active tab: [tab_id] [url]
[Background] Attaching debugger to tab [tab_id]...
[Background] ✓ Debugger attached successfully
[Background] Capturing full-page screenshot via CDP...
[Background] ✓ Full-page screenshot captured successfully
[Background]   Screenshot size: [size] chars ~ [size] KB
[Background] ✓ Debugger detached
[Background] Preparing to send response with screenshot data...
[Background] Sending response: { success: true, hasScreenshot: true, error: undefined }
[Background] ✓ Response sent successfully
[QuickPromptButtons] Screenshot captured successfully
[QuickPromptButtons] Prompt text: [prompt content]
[QuickPromptButtons] Sending runtime message with screenshot...
[QuickPromptButtons] Message sent successfully!
```

3. **Verify in the Chat UI:**
   - A new message should appear with your prompt
   - Gemini AI should analyze the screenshot and respond
   - Response should reference content from the full page (including MARKER 1, 2, 3, 4)

### Step 6: Verify Full-Page Capture

The AI response should mention:
- ✅ All 4 markers (MARKER 1, MARKER 2, MARKER 3, MARKER 4)
- ✅ Content beyond the viewport (not just what's visible)
- ✅ The test page structure and purpose

This confirms the `captureBeyondViewport: true` setting is working.

## Expected Results

### ✅ Success Indicators

1. **Console Logs**: All "[Background] ✓" success messages appear
2. **No Errors**: No "message channel closed" errors
3. **Full Page**: AI mentions content beyond viewport
4. **Response Speed**: Screenshot capture completes in < 2 seconds
5. **UI Feedback**: Buttons show loading state during capture

### ❌ Failure Indicators & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Another debugger is already attached" | DevTools open or other debugger | Close all DevTools panels |
| "Cannot capture screenshot of restricted page" | Testing on chrome://, chrome-extension://, etc. | Navigate to http:// or https:// page |
| "No active tab found" | Tab lost focus | Click the tab to make it active |
| "Message channel closed before response" | Should be fixed with IIFE wrapper | Check if using latest build |
| No quick prompt buttons visible | UI rendering issue | Check console, scroll in Chat tab |
| API error from Gemini | API key not configured | Go to Settings, add Gemini API key |

## Troubleshooting

### Issue: Buttons Not Visible

1. Open browser console (F12)
2. Check for React rendering errors
3. Verify you're on the Chat tab
4. Try scrolling up in the message area
5. Check if `QuickPromptButtons` component is in DOM:
   ```javascript
   // In console:
   document.querySelector('[class*="quick"]')
   // Should return an element if buttons exist
   ```

### Issue: Screenshot Fails

1. Check current tab URL:
   - Must be http:// or https://
   - Cannot be chrome://, about:, edge://, chrome-extension://
2. Close all DevTools panels
3. Reload extension
4. Try on the test page first

### Issue: Gemini Not Responding

1. Check API key in Settings
2. Check browser console for API errors
3. Verify internet connection
4. Check Gemini API quota/rate limits

## Testing Different Scenarios

### Test Case 1: Regular Webpage
- URL: https://www.google.com
- Expected: Full page screenshot, Gemini analyzes Google homepage

### Test Case 2: Long Article
- URL: Any long article (Wikipedia, Medium, etc.)
- Expected: Captures entire article beyond viewport

### Test Case 3: Test Page
- URL: file:///Users/lman/gemini/CPO-tars/test-screenshot.html
- Expected: Gemini mentions all 4 markers

### Test Case 4: Restricted Page (Should Fail)
- URL: chrome://extensions
- Expected: Error message about restricted page

## Code Reference

All CDP screenshot code is in:
- **Source**: `/Users/lman/gemini/CPO-tars/src/background/index.ts:50-162`
- **Compiled**: `/Users/lman/gemini/CPO-tars/build/chrome-mv3-dev/static/background/index.js:680-787`

Quick Prompt Buttons:
- **Source**: `/Users/lman/gemini/CPO-tars/src/sidepanel/pages/conversation.tsx:871-969`
- **Rendered**: Line 1599 in same file

## Reporting Issues

When reporting issues, please include:
1. Screenshots of the issue
2. Full browser console logs
3. URL of the page being tested
4. Steps to reproduce
5. Expected vs actual behavior

## Next Steps After Testing

Once you confirm the feature works:
- [ ] Test on multiple websites
- [ ] Test with different quick prompts (📝💡✍️✅)
- [ ] Verify response quality from Gemini
- [ ] Test error handling (restricted pages, no API key, etc.)
- [ ] Performance testing (large pages, slow connections)

---

**Last Updated**: 2025-11-29
**Build Version**: chrome-mv3-dev (Plasmo 0.86.1)
**CDP Version**: 1.3
