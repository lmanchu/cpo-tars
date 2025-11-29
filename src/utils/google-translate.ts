export async function translateWithGoogle(
    text: string,
    targetLang: string = 'en'
): Promise<string> {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();

        // data[0] contains the translation segments
        // Each segment is [translated_text, original_text, ...]
        if (data && data[0]) {
            return data[0].map((segment: any) => segment[0]).join('');
        }
        return text;
    } catch (error) {
        console.error('Google Translate error:', error);
        throw error;
    }
}
