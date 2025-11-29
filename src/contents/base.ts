/**
 * Merge AI message with quoting text
 * Used to combine user input with quoted/selected text
 */
export function mergeAiMsg(message: string, quotingText?: string): string {
    if (!quotingText) {
        return message;
    }

    return `${message}\n\n--- Quoted Text ---\n${quotingText}`;
}
