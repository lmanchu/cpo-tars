import { Logger } from "~utils/logger";

/**
 * Panel type enum
 */
export enum OpenPanelType {
    SEARCH = "search",
    AI_ASK = "ai_ask"
}

/**
 * Interface for panel open data
 */
export interface IOpenPanelData {
    openType: OpenPanelType;
    data?: any;
}

/**
 * IAskAi - Data class for AI conversation requests
 */
export class IAskAi {
    prompt: string;
    lang?: string;
    text: string | null;
    promptText?: string | null;
    appendix?: string;
    promptImageUri?: string;
    promptImageTitle?: string;
    promptType?: number;
    isHaveUploadFile?: boolean;
    uploadFile?: [string, string, Map<string, string>, any, File | null] | null;

    constructor(params: {
        prompt: string;
        lang?: string;
        text: string | null;
        promptText?: string | null;
        appendix?: string;
        promptImageUri?: string;
        promptImageTitle?: string;
        promptType?: number;
        isHaveUploadFile?: boolean;
        uploadFile?: [string, string, Map<string, string>, any, File | null] | null;
    }) {
        this.prompt = params.prompt;
        this.lang = params.lang;
        this.text = params.text;
        this.promptText = params.promptText;
        this.appendix = params.appendix;
        this.promptImageUri = params.promptImageUri;
        this.promptImageTitle = params.promptImageTitle;
        this.promptType = params.promptType;
        this.isHaveUploadFile = params.isHaveUploadFile;
        this.uploadFile = params.uploadFile;
    }
}

/**
 * Open panel for AI search
 * This is a placeholder - full search functionality to be implemented
 */
export function openPanelSearchInContent(query: string): void {
    Logger.log('[openPanelSearchInContent] Search query:', query);
    // TODO: Implement search panel opening logic
    // For now, just log the query
}
