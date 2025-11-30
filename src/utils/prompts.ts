// Prompt templates for CPO TARS
// Based on BrainyAI's PromptDatas with customization for CPO TARS

export interface PromptTemplate {
    id: string;
    title: string;
    description: string;
    icon: string;
    template: string;
    category: 'text' | 'image' | 'pdf' | 'vision';
    forceVision?: boolean;  // Force vision mode for this prompt
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
        template: `Condense the following text into a concise summary: ${PROMPT_PLACEHOLDER_TEXT}. Please respond in ${PROMPT_PLACEHOLDER_LANG}.`,
        category: 'text'
    },
    {
        id: 'explain',
        title: 'Explain',
        description: 'Clarify and explain the text',
        icon: 'icon_explain.svg',
        template: `Clarify and explain the following text in simple terms: ${PROMPT_PLACEHOLDER_TEXT}. Please respond in ${PROMPT_PLACEHOLDER_LANG}.`,
        category: 'text'
    },
    {
        id: 'rephrase',
        title: 'Rephrase',
        description: 'Rewrite text in different words',
        icon: 'icon_rephrase.svg',
        template: `Rephrase the following text while maintaining its meaning: ${PROMPT_PLACEHOLDER_TEXT}. Please respond in ${PROMPT_PLACEHOLDER_LANG}, focusing on the core topic.`,
        category: 'text'
    },
    {
        id: 'grammar',
        title: 'Grammar Check',
        description: 'Fix grammar and spelling errors',
        icon: 'icon_grammar_check.svg',
        template: `Correct grammar mistakes, typos, and factual errors in the following text: ${PROMPT_PLACEHOLDER_TEXT}. Please respond in ${PROMPT_PLACEHOLDER_LANG}, focusing on the core topic.`,
        category: 'text'
    },
    {
        id: 'ask-ai',
        title: 'Ask AI',
        description: 'Ask anything about the selected text',
        icon: 'icon_ask_ai.svg',
        template: `${PROMPT_PLACEHOLDER_TEXT}`,
        category: 'text'
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
    return [...TEXT_PROMPTS, ...VISION_PROMPTS].find(p => p.id === id);
}

// Vision-specific prompts that require screenshot analysis
export const VISION_PROMPTS: PromptTemplate[] = [
    {
        id: 'vision-summarize',
        title: 'Vision Summarize',
        description: 'Summarize page including all visual elements',
        icon: 'icon_vision_summarize.svg',
        template: `Provide a comprehensive summary of this webpage, including:
- Main textual content
- All visual elements (images, charts, diagrams, graphs)
- Data shown in any visualizations
- Key insights from both text and visuals

Please respond in ${PROMPT_PLACEHOLDER_LANG}.`,
        category: 'vision',
        forceVision: true
    },
    {
        id: 'describe-visuals',
        title: 'Describe Visuals',
        description: 'Describe all images, charts, and diagrams',
        icon: 'icon_describe_visuals.svg',
        template: `Describe all the visual elements on this page:
- Images and their content
- Charts and graphs (including data they show)
- Diagrams and illustrations
- Tables with data
- Any other visual information

For each visual element, explain what it shows and its significance.

Please respond in ${PROMPT_PLACEHOLDER_LANG}.`,
        category: 'vision',
        forceVision: true
    },
    {
        id: 'extract-chart-data',
        title: 'Extract Chart Data',
        description: 'Extract data from charts and graphs',
        icon: 'icon_chart_data.svg',
        template: `Extract and analyze all the data from charts, graphs, and tables on this page:
- Chart types and their purposes
- Numerical values and data points
- Trends and patterns
- Key insights and takeaways
- Any notable outliers or anomalies

Please respond in ${PROMPT_PLACEHOLDER_LANG}.`,
        category: 'vision',
        forceVision: true
    }
];

// Check if a prompt requires vision mode
export function requiresVision(promptId: string): boolean {
    const prompt = getPromptById(promptId);
    return prompt?.forceVision === true || prompt?.category === 'vision';
}
