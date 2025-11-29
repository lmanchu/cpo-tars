import { translateWithGoogle } from './google-translate';
import { translateWithGemini } from './gemini-translate';
import type { UserSettings } from '~types';

export async function translate(text: string, settings: UserSettings): Promise<{ text: string; engine: 'google' | 'gemini' }> {
    const { translationEngine, geminiApiKey, isPro, targetLanguage } = settings;

    if (translationEngine === 'gemini' && isPro && geminiApiKey) {
        try {
            const result = await translateWithGemini(text, targetLanguage, geminiApiKey);
            return { text: result, engine: 'gemini' };
        } catch (error) {
            console.warn('Gemini translation failed, falling back to Google', error);
            // Fallback to Google if Gemini fails
        }
    }

    const result = await translateWithGoogle(text, targetLanguage);
    return { text: result, engine: 'google' };
}
