# Message Channel Error Fix

## Problem

After implementing Vision-Enhanced Macros, users encountered the following error when clicking macro buttons:

```
Failed to execute prompt: A listener indicated an asynchronous response by returning true,
but the message channel closed before a response was received
```

## Root Cause

The error occurred because:

1. **MacrosTab.tsx** (line 90-98) sends a `chrome.runtime.sendMessage` with type `"EXECUTE_PROMPT"`
2. **background/index.ts** message listener only handled `"CAPTURE_SCREENSHOT"` and `"OPEN_SIDE_PANEL"` messages
3. The `"EXECUTE_PROMPT"` message went unhandled, causing Chrome to wait for a response that never came
4. After a timeout, the message channel closed, triggering the error

## Solution

Added a handler for `"EXECUTE_PROMPT"` messages in the background script's message listener:

### File: `src/background/index.ts`

```typescript
if (message.type === "EXECUTE_PROMPT") {
    // Handle prompt execution from MacrosTab
    // The execution data is already stored in chrome.storage.local by MacrosTab
    // This handler just acknowledges the message
    console.log('[Background] EXECUTE_PROMPT message received, prompt stored in chrome.storage.local');
    sendResponse({ success: true });
    return false; // Synchronous response
}
```

**Why this works:**
- MacrosTab already stores all necessary data in `chrome.storage.local` (lines 79-87)
- MacrosTab already dispatches a custom event to switch to Chat tab (line 101)
- The background handler just needs to acknowledge the message
- No async work is needed, so we return `false` (synchronous response)

### File: `src/background/messages/execute-prompt.ts`

Also updated the Plasmo message handler to support the new `pageContext` parameter:

```typescript
import type { PageContext } from "~utils/enhanced-observation";

export interface ExecutePromptRequest {
    prompt: string;
    promptTitle: string;
    selectedText: string;
    pageContext?: PageContext;  // NEW: Enhanced page context with vision support
}
```

This ensures that when the execute-prompt handler is called from content scripts (e.g., floating toolbar), it can also pass along vision context.

## Testing

After applying this fix:

1. ✅ Extension builds successfully
2. ✅ No more "message channel closed" errors
3. ✅ Macro buttons work correctly
4. ✅ Vision context is properly passed through the messaging chain

## Flow Diagram

### Before Fix (Error)
```
MacrosTab clicks button
    ↓
MacrosTab stores data in chrome.storage.local
    ↓
MacrosTab sends chrome.runtime.sendMessage("EXECUTE_PROMPT")
    ↓
Background listener: ❌ NO HANDLER
    ↓
Chrome waits for response...
    ↓
Timeout → Message channel closed → ERROR
```

### After Fix (Working)
```
MacrosTab clicks button
    ↓
MacrosTab stores data in chrome.storage.local
    ↓
MacrosTab sends chrome.runtime.sendMessage("EXECUTE_PROMPT")
    ↓
Background listener: ✅ Handles "EXECUTE_PROMPT"
    ↓
sendResponse({ success: true })
    ↓
MacrosTab dispatches custom event "switch-to-chat"
    ↓
Chat tab picks up data from chrome.storage.local
    ↓
✅ Success!
```

## Related Files

- `src/background/index.ts` - Added EXECUTE_PROMPT handler
- `src/background/messages/execute-prompt.ts` - Updated interface for pageContext
- `src/sidepanel/components/MacrosTab.tsx` - Sends EXECUTE_PROMPT message
- `src/utils/enhanced-observation.ts` - Defines PageContext type

## Prevention

To prevent similar issues in the future:

1. **Always add handlers** for every message type you send via `chrome.runtime.sendMessage`
2. **Check message listeners** in background script when adding new messaging flows
3. **Use TypeScript** to catch missing message types at compile time
4. **Log messages** with `console.log('[Component] Message type:', message.type)` for debugging

## Date

Fixed: 2025-11-30
