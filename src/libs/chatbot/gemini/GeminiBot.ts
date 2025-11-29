import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { Storage } from '@plasmohq/storage';
import { BotBase, BotSupportedMimeType } from '~libs/chatbot/BotBase';
import type { BotCompletionParams, BotConstructorParams, IBot } from '~libs/chatbot/IBot';
import { ConversationResponse, ResponseMessageType } from '~libs/open-ai/open-ai-interface';
import { ChatError, ErrorCode } from '~utils/errors';
import { Logger } from '~utils/logger';
import GeminiLogo from 'data-base64:~assets/g_icon_ask.svg';

export class GeminiBot extends BotBase implements IBot {
    static botName = 'Gemini 2.0 Flash';
    static logoSrc = GeminiLogo;
    static loginUrl = '';
    static requireLogin = false;
    static supportUploadPDF = false;
    static supportUploadImage = true;
    static desc = 'Google Gemini 2.0 Flash - Fast and multimodal';
    static maxTokenLimit = 32000;
    static paidModel = false;
    static newModel = true;

    private storage = new Storage();
    private model: GenerativeModel | null = null;
    private apiKey: string = '';

    supportedUploadTypes = [
        BotSupportedMimeType.PNG,
        BotSupportedMimeType.JPEG,
        BotSupportedMimeType.JPG,
        BotSupportedMimeType.WEBP,
        BotSupportedMimeType.GIF
    ];

    constructor(params: BotConstructorParams) {
        super(params);
    }

    async startAuth(): Promise<boolean> {
        // Gemini doesn't require login, just API key
        return true;
    }

    async startCaptcha(): Promise<boolean> {
        return true;
    }

    private async initializeModel(): Promise<boolean> {
        try {
            // Get API key from userSettings in storage
            const userSettings = await this.storage.get<any>('userSettings');
            this.apiKey = userSettings?.geminiApiKey || '';

            if (!this.apiKey) {
                Logger.warn('[GeminiBot] No API key found in storage');
                return false;
            }

            const genAI = new GoogleGenerativeAI(this.apiKey);
            this.model = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash-exp',
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                }
            });

            return true;
        } catch (error) {
            Logger.error('[GeminiBot] Failed to initialize model:', error);
            return false;
        }
    }

    async completion(params: BotCompletionParams): Promise<void> {
        const { prompt, rid, cb, file } = params;

        try {
            // Initialize model
            const initialized = await this.initializeModel();
            if (!initialized) {
                cb(rid, {
                    message_type: ResponseMessageType.ERROR,
                    message_text: '',
                    error: new ChatError(
                        'Please set your Gemini API key in settings',
                        ErrorCode.UNAUTHORIZED
                    )
                });
                return;
            }

            Logger.log('[GeminiBot] Starting completion:', { prompt, hasFile: !!file });

            // Send initial generating status
            cb(rid, {
                message_type: ResponseMessageType.GENERATING,
                message_text: ''
            });

            // Prepare content parts
            const parts: any[] = [];

            // Add image if provided
            if (file && this.supportedUploadTypes.includes(file.type as BotSupportedMimeType)) {
                const imageData = await this.fileToBase64(file);
                parts.push({
                    inlineData: {
                        mimeType: file.type,
                        data: imageData
                    }
                });
                Logger.log('[GeminiBot] Added image to request');
            }

            // Add text prompt
            parts.push({ text: prompt });

            // Generate content with streaming
            const result = await this.model!.generateContentStream(parts);

            let fullText = '';
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                fullText += chunkText;

                // Send streaming update
                cb(rid, {
                    message_type: ResponseMessageType.ANSWER,
                    message_text: fullText
                });
            }

            // Send final done status
            cb(rid, {
                message_type: ResponseMessageType.DONE,
                message_text: fullText
            });

            Logger.log('[GeminiBot] Completion finished');

        } catch (error: any) {
            Logger.error('[GeminiBot] Completion failed:', error);

            let errorCode = ErrorCode.NETWORK_ERROR;
            let errorMessage = error?.message || 'Unknown error occurred';

            // Parse Gemini API errors
            if (error?.message?.includes('API_KEY_INVALID')) {
                errorCode = ErrorCode.UNAUTHORIZED;
                errorMessage = 'Invalid Gemini API key';
            } else if (error?.message?.includes('quota')) {
                errorCode = ErrorCode.CONVERSATION_LIMIT;
                errorMessage = 'Gemini API quota exceeded';
            }

            cb(rid, {
                message_type: ResponseMessageType.ERROR,
                message_text: '',
                error: new ChatError(errorMessage, errorCode)
            });
        }
    }

    async uploadFile(file: File): Promise<string> {
        // For Gemini, we handle images directly in completion
        // Return a placeholder token
        return `gemini_file_${Date.now()}`;
    }

    private async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data:image/xxx;base64, prefix
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    getBotName(): string {
        return GeminiBot.botName;
    }

    getRequireLogin(): boolean {
        return GeminiBot.requireLogin;
    }

    getLogoSrc(): string {
        return GeminiBot.logoSrc;
    }

    getLoginUrl(): string {
        return GeminiBot.loginUrl;
    }

    getSupportUploadPDF(): boolean {
        return GeminiBot.supportUploadPDF;
    }

    getSupportUploadImage(): boolean {
        return GeminiBot.supportUploadImage;
    }

    getMaxTokenLimit(): number {
        return GeminiBot.maxTokenLimit;
    }

    getPaidModel(): boolean {
        return GeminiBot.paidModel;
    }

    getNewModel(): boolean {
        return GeminiBot.newModel;
    }
}

export default GeminiBot;
