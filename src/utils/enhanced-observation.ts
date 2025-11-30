/**
 * Enhanced Page Observation for Vision-Enhanced Macros
 *
 * Intelligently combines Browser Agent's visual observation (screenshot + DOM)
 * with traditional text extraction for optimal performance and API cost.
 */

import { observePage, type Observation } from './browser-agent';
import { getTabSelection } from './tab-selection';

export interface PageContext {
    type: 'vision' | 'text';
    // Vision mode
    screenshot?: string;
    dom?: any;
    // Text mode
    text?: string;
    // Common
    url: string;
    title: string;
    timestamp: number;
    // Metadata
    hasVisualContent?: boolean;
}

/**
 * Detect if the current page has significant visual content
 * that would benefit from vision-based analysis
 */
export async function detectVisualContent(): Promise<boolean> {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.id) {
            console.warn('[detectVisualContent] No active tab');
            return false;
        }

        const [result] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // Check for images (excluding tracking pixels and tiny images)
                const images = Array.from(document.querySelectorAll('img[src]')).filter(img => {
                    const width = img.width || img.naturalWidth;
                    const height = img.height || img.naturalHeight;
                    return width > 50 && height > 50;  // Exclude small images/icons
                });

                if (images.length > 2) {
                    console.log('[detectVisualContent] Found significant images:', images.length);
                    return true;
                }

                // Check for Canvas elements (often used for charts)
                const canvases = document.querySelectorAll('canvas');
                if (canvases.length > 0) {
                    console.log('[detectVisualContent] Found canvas elements:', canvases.length);
                    return true;
                }

                // Check for SVG elements (charts, diagrams, icons)
                // Only count large SVGs (likely to be charts/diagrams, not icons)
                const svgs = Array.from(document.querySelectorAll('svg')).filter(svg => {
                    const rect = svg.getBoundingClientRect();
                    return rect.width > 100 && rect.height > 100;
                });

                if (svgs.length > 0) {
                    console.log('[detectVisualContent] Found large SVG elements:', svgs.length);
                    return true;
                }

                // Check for complex tables (data tables with many rows)
                const tables = Array.from(document.querySelectorAll('table')).filter(table => {
                    const rows = table.querySelectorAll('tr').length;
                    const cols = table.querySelector('tr')?.querySelectorAll('td, th').length || 0;
                    return rows > 5 || cols > 4;  // Significant data table
                });

                if (tables.length > 0) {
                    console.log('[detectVisualContent] Found complex tables:', tables.length);
                    return true;
                }

                // Check for iframe embeds (videos, charts, embedded content)
                const iframes = document.querySelectorAll('iframe:not([width="1"]):not([height="1"])');
                if (iframes.length > 0) {
                    console.log('[detectVisualContent] Found iframe embeds:', iframes.length);
                    return true;
                }

                console.log('[detectVisualContent] No significant visual content detected');
                return false;
            }
        });

        return result.result || false;
    } catch (error) {
        console.error('[detectVisualContent] Error detecting visual content:', error);
        // On error, default to false (use text mode)
        return false;
    }
}

/**
 * Get enhanced page context with intelligent vision/text selection
 *
 * @param forceVision - Force vision mode regardless of content detection
 * @param enableSmartDetection - Enable automatic visual content detection (default: true)
 */
export async function getEnhancedPageContext(
    forceVision: boolean = false,
    enableSmartDetection: boolean = true
): Promise<PageContext> {
    console.log('[getEnhancedPageContext] Starting...', { forceVision, enableSmartDetection });

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.id) {
            throw new Error('No active tab found');
        }

        // Determine if we should use vision mode
        let useVision = forceVision;
        let hasVisualContent = false;

        if (!forceVision && enableSmartDetection) {
            hasVisualContent = await detectVisualContent();
            useVision = hasVisualContent;
        }

        console.log('[getEnhancedPageContext] Mode decision:', {
            useVision,
            hasVisualContent,
            forceVision,
            enableSmartDetection
        });

        if (useVision) {
            // Vision mode: Use Browser Agent's observePage()
            console.log('[getEnhancedPageContext] Using VISION mode');
            const observation = await observePage();

            return {
                type: 'vision',
                screenshot: observation.screenshot,
                dom: observation.dom,
                url: observation.url,
                title: observation.title,
                timestamp: observation.timestamp,
                hasVisualContent: true
            };
        } else {
            // Text mode: Use traditional text extraction
            console.log('[getEnhancedPageContext] Using TEXT mode');
            const text = await getTabSelection();

            return {
                type: 'text',
                text: text || '',
                url: tab.url || '',
                title: tab.title || '',
                timestamp: Date.now(),
                hasVisualContent: false
            };
        }
    } catch (error) {
        console.error('[getEnhancedPageContext] Error getting enhanced context:', error);

        // Fallback to text mode on error
        console.warn('[getEnhancedPageContext] Falling back to text mode due to error');
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const text = await getTabSelection();

            return {
                type: 'text',
                text: text || '',
                url: tab.url || '',
                title: tab.title || '',
                timestamp: Date.now(),
                hasVisualContent: false
            };
        } catch (fallbackError) {
            console.error('[getEnhancedPageContext] Fallback also failed:', fallbackError);
            throw new Error('Failed to get page context');
        }
    }
}

/**
 * Extract text content from DOM info for vision prompts
 */
export function extractTextFromDOM(domInfo: any): string {
    if (!domInfo || !domInfo.elements) {
        return '';
    }

    // Extract text from all elements
    const texts = domInfo.elements
        .map((el: any) => el.text?.trim())
        .filter((text: string) => text && text.length > 0);

    // Remove duplicates and join
    const uniqueTexts = [...new Set(texts)];
    return uniqueTexts.join('\n');
}

/**
 * Build a vision-enhanced prompt with both screenshot and text context
 */
export function buildVisionPrompt(
    basePrompt: string,
    pageContext: PageContext,
    targetLanguage: string = 'English'
): string {
    if (pageContext.type === 'text') {
        // Simple text mode - just use the base prompt
        return basePrompt;
    }

    // Vision mode - enhance prompt to leverage visual analysis
    const textContent = pageContext.dom
        ? extractTextFromDOM(pageContext.dom)
        : 'No text extracted';

    const visionPrompt = `You are viewing a webpage. I will provide you with:
1. A screenshot of the page (attached as image)
2. The text content extracted from the page

Please analyze BOTH the visual elements (images, charts, diagrams, layout) and the text content to fulfill the following request:

${basePrompt}

Text content from page:
---
${textContent.substring(0, 5000)}
---

IMPORTANT:
- Pay attention to visual elements like charts, graphs, images, and diagrams in the screenshot
- Describe or reference visual content when relevant to the request
- Consider the visual layout and structure of the page
- If there are data visualizations (charts/graphs), extract and describe the data they show
- Please respond in ${targetLanguage}
`;

    return visionPrompt;
}

/**
 * Check if page context contains visual data
 */
export function hasVisualData(pageContext: PageContext): boolean {
    return pageContext.type === 'vision' && !!pageContext.screenshot;
}
