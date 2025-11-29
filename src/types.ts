export interface TranslationHistory {
    id: string;
    originalText: string;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
    engine: 'google' | 'gemini';
    timestamp: number;
}

export interface PromptMacro {
    id: string;
    name: string;
    prompt: string;
    shortcut?: string;
    icon?: string;
    isDefault: boolean;
}

export interface VLMRecord {
    id: string;
    imageUrl: string;
    analysis: string;
    prompt: string;
    timestamp: number;
}

export interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    targetLanguage: string;
    translationEngine: 'google' | 'gemini';
    chatbotEngine: 'gemini';
    geminiApiKey?: string;
    isPro: boolean;
}
