import { GoogleGenerativeAI } from '@google/generative-ai';

export async function translateWithGemini(
    text: string,
    targetLang: string,
    apiKey: string
): Promise<string> {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `Translate the following text to ${targetLang}. Only return the translation, no explanations:\n\n${text}`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('Gemini Translate error:', error);
        throw error;
    }
}
