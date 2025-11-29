import type { ChatError } from "~utils/errors";

export enum ResponseMessageType {
    ANSWER = 'answer',
    GENERATING = 'generating',
    DONE = 'done',
    ERROR = 'error'
}

export interface ConversationResponse {
    message_type: ResponseMessageType;
    message_text?: string;
    error?: ChatError;
    appendix?: any;
}
