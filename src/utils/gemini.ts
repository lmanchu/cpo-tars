import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

export const initGemini = (apiKey: string) => {
    genAI = new GoogleGenerativeAI(apiKey);
};

export const generateContent = async (prompt: string, modelName: string = "gemini-pro") => {
    if (!genAI) throw new Error("Gemini API key not set");
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    return result.response.text();
};

export const generateVisionContent = async (prompt: string, imageBase64: string) => {
    if (!genAI) throw new Error("Gemini API key not set");
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    const image = {
        inlineData: {
            data: imageBase64,
            mimeType: "image/png",
        },
    };
    const result = await model.generateContent([prompt, image]);
    return result.response.text();
}
