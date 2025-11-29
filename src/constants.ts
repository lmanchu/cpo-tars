import type { PromptMacro } from "./types";

export const FREE_TRANSLATION_QUOTA = 50;
export const FREE_VLM_QUOTA = 3;
export const FREE_MACRO_LIMIT = 5;

export const DEFAULT_MACROS: PromptMacro[] = [
    { id: '1', name: '總結', prompt: '請用 3 個要點總結: {selection}', shortcut: 'Ctrl+Shift+1', icon: '📝', isDefault: true },
    { id: '2', name: '翻譯', prompt: '請翻譯成英文: {selection}', shortcut: 'Ctrl+Shift+2', icon: '🌐', isDefault: true },
    { id: '3', name: '解釋', prompt: '請解釋這個概念: {selection}', shortcut: 'Ctrl+Shift+3', icon: '💡', isDefault: true },
];
