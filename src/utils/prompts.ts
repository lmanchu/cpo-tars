// Prompt templates for CPO TARS
// Based on BrainyAI's PromptDatas with customization for CPO TARS

export interface PromptTemplate {
    id: string;
    title: string;
    description: string;
    icon: string;
    template: string;
    category: 'text' | 'image' | 'pdf';
}

// Placeholders used in templates
export const PROMPT_PLACEHOLDER_TEXT = '{{SELECTED_TEXT}}';
export const PROMPT_PLACEHOLDER_LANG = '{{TARGET_LANGUAGE}}';

// Text operation prompts
export const TEXT_PROMPTS: PromptTemplate[] = [
    {
        id: 'summarize',
        title: 'Summarize',
        description: 'Condense text into a brief summary',
        icon: 'icon_summarize.svg',
        template: `Condense the following text into a concise summary: ${PROMPT_PLACEHOLDER_TEXT}. Please respond in ${PROMPT_PLACEHOLDER_LANG}.`
    },
    {
        id: 'explain',
        title: 'Explain',
        description: 'Clarify and explain the text',
        icon: 'icon_explain.svg',
        template: `Clarify and explain the following text in simple terms: ${PROMPT_PLACEHOLDER_TEXT}. Please respond in ${PROMPT_PLACEHOLDER_LANG}.`
    },
    {
        id: 'rephrase',
        title: 'Rephrase',
        description: 'Rewrite text in different words',
        icon: 'icon_rephrase.svg',
        template: `Rephrase the following text while maintaining its meaning: ${PROMPT_PLACEHOLDER_TEXT}. Please respond in ${PROMPT_PLACEHOLDER_LANG}, focusing on the core topic.`
    },
    {
        id: 'grammar',
        title: 'Grammar Check',
        description: 'Fix grammar and spelling errors',
        icon: 'icon_grammar_check.svg',
        template: `Correct grammar mistakes, typos, and factual errors in the following text: ${PROMPT_PLACEHOLDER_TEXT}. Please respond in ${PROMPT_PLACEHOLDER_LANG}, focusing on the core topic.`
    },
    {
        id: 'ask-ai',
        title: 'Ask AI',
        description: 'Ask anything about the selected text',
        icon: 'icon_ask_ai.svg',
        template: `${PROMPT_PLACEHOLDER_TEXT}`
    }
];

// Helper function to fill prompt template
export function fillPromptTemplate(
    template: string,
    selectedText: string,
    targetLanguage: string = 'English'
): string {
    return template
        .replace(PROMPT_PLACEHOLDER_TEXT, selectedText)
        .replace(PROMPT_PLACEHOLDER_LANG, targetLanguage);
}

// Get prompt by ID
export function getPromptById(id: string): PromptTemplate | undefined {
    return TEXT_PROMPTS.find(p => p.id === id);
}
