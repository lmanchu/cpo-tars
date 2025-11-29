/**
 * CPO TARS - Immersive Translation Content Script
 * Based on Fliplang implementation
 *
 * Three translation modes:
 * 1. Hover + Ctrl: Translate sentence by sentence
 * 2. Ctrl+Shift+A: Translate entire page
 * 3. Triple space: Translate input text
 */

import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"
import { translateWithGoogle } from "~utils/google-translate"
import { translateWithGemini } from "~utils/gemini-translate"
import "./index.css"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

console.log('[CPO TARS] Immersive Translation loaded 🚀')

const storage = new Storage()

// Translation state
let isTranslating = false
let translationCache = new Map<string, string>()

// Hover translation state
let hoveredElement: HTMLElement | null = null
let isHoverTranslationActive = false

// Input enhancement state
let spacePressTimes: number[] = []
let currentInputElement: HTMLInputElement | HTMLTextAreaElement | HTMLElement | null = null

/**
 * Request translation
 */
async function requestTranslation(text: string, mode: 'reading' | 'writing' = 'reading'): Promise<string> {
  // Check cache
  const cacheKey = `${mode}:${text}`
  if (translationCache.has(cacheKey)) {
    console.log('[CPO TARS] Cache hit:', text.substring(0, 50))
    return translationCache.get(cacheKey)!
  }

  // Get settings
  const isPro = await storage.get<boolean>('isPro') || false
  const readingLanguage = await storage.get<string>('readingLanguage') || 'zh-TW'
  const writingLanguage = await storage.get<string>('writingLanguage') || 'en'
  const translationEngine = await storage.get<'google' | 'gemini'>('translationEngine') || 'google'
  const geminiApiKey = await storage.get<string>('geminiApiKey') || ''

  // Choose target language based on mode
  const targetLanguage = mode === 'writing' ? writingLanguage : readingLanguage

  console.log(`[CPO TARS] Translation mode: ${mode}, target: ${targetLanguage}, engine: ${translationEngine}`)

  try {
    let result: string

    if (translationEngine === 'gemini' && isPro && geminiApiKey) {
      result = await translateWithGemini(text, targetLanguage, geminiApiKey)
    } else {
      result = await translateWithGoogle(text, targetLanguage)
    }

    // Cache result
    translationCache.set(cacheKey, result)
    return result
  } catch (error) {
    console.error('[CPO TARS] Translation failed:', error)
    throw error
  }
}

/**
 * Get all text nodes
 */
function getAllTextNodes(element: HTMLElement): Text[] {
  const textNodes: Text[] = []
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node: Node) => {
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT

        const tagName = parent.tagName.toLowerCase()
        if (['script', 'style', 'noscript', 'iframe'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT
        }

        if (parent.classList.contains('cpo-translation')) {
          return NodeFilter.FILTER_REJECT
        }

        const text = node.textContent?.trim() || ''
        if (text.length === 0) {
          return NodeFilter.FILTER_REJECT
        }

        return NodeFilter.FILTER_ACCEPT
      }
    }
  )

  let node: Node | null
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text)
  }

  return textNodes
}

/**
 * Insert translation into DOM
 */
function insertTranslation(textNode: Text, originalText: string, translation: string): void {
  const parent = textNode.parentElement
  if (!parent) return

  const container = document.createElement('span')
  container.className = 'cpo-translation-container'

  const original = document.createElement('span')
  original.className = 'cpo-original'
  original.textContent = originalText

  const translated = document.createElement('span')
  translated.className = 'cpo-translated'
  translated.textContent = translation

  container.appendChild(original)
  container.appendChild(translated)

  parent.replaceChild(container, textNode)
}

/**
 * Handle full page translation
 */
async function handlePageTranslation(): Promise<void> {
  if (isTranslating) {
    removeAllTranslations()
    isTranslating = false
    showNotification('Translation cancelled', 'info')
    return
  }

  isTranslating = true
  showNotification('Translating page...', 'info')

  try {
    const textNodes = getAllTextNodes(document.body)
    console.log('[CPO TARS] Found text nodes:', textNodes.length)

    let translated = 0
    const batchSize = 5

    for (let i = 0; i < textNodes.length; i += batchSize) {
      const batch = textNodes.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (node) => {
          const text = node.textContent?.trim() || ''

          // Skip short or numeric text
          if (text.length < 10 || /^[\d\s\p{P}]+$/u.test(text)) {
            return
          }

          try {
            const translation = await requestTranslation(text)
            insertTranslation(node, text, translation)
            translated++
          } catch (error) {
            console.error('[CPO TARS] Failed to translate node:', error)
          }
        })
      )

      // Update progress
      const progress = Math.round((i + batch.length) / textNodes.length * 100)
      showNotification(`Translating... ${progress}%`, 'info')
    }

    isTranslating = false
    showNotification(`Translation complete! Translated ${translated} paragraphs`, 'success')
  } catch (error) {
    console.error('[CPO TARS] Page translation failed:', error)
    isTranslating = false
    showNotification('Translation failed: ' + (error as Error).message, 'error')
  }
}

/**
 * Remove all translations
 */
function removeAllTranslations(): void {
  const translations = document.querySelectorAll('.cpo-translation-container')
  translations.forEach((container) => {
    const originalText = container.querySelector('.cpo-original')?.textContent || ''
    const textNode = document.createTextNode(originalText)
    container.parentNode?.replaceChild(textNode, container)
  })

  translationCache.clear()
}

/**
 * Show notification
 */
function showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  const existing = document.getElementById('cpo-notification')
  if (existing) {
    existing.remove()
  }

  const notification = document.createElement('div')
  notification.id = 'cpo-notification'
  notification.className = `cpo-notification cpo-notification-${type}`
  notification.textContent = message

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.classList.add('cpo-notification-fade-out')
    setTimeout(() => notification.remove(), 300)
  }, 3000)
}

/**
 * Escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * ===========================================
 * HOVER TRANSLATION
 * ===========================================
 */

// Track hovered element
let lastLoggedElement: HTMLElement | null = null
document.addEventListener('mousemove', (e) => {
  const element = (e.target as HTMLElement).closest('p, div, span, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, pre') as HTMLElement

  if (element &&
      !element.classList.contains('cpo-translation-container') &&
      !element.classList.contains('cpo-tooltip') &&
      !element.classList.contains('cpo-notification')) {

    if (element !== lastLoggedElement) {
      console.log('[CPO TARS] Hovered element:', element.tagName, element.textContent?.substring(0, 30) + '...')
      lastLoggedElement = element
    }

    hoveredElement = element
  }
})

// Listen for Ctrl key
document.addEventListener('keydown', async (e) => {
  const isCtrlOnly = (e.key === 'Control' && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey)

  if (isCtrlOnly && hoveredElement && !isHoverTranslationActive) {
    console.log('[CPO TARS] Ctrl pressed, hoveredElement:', hoveredElement)
    e.preventDefault()
    await handleHoverTranslation()
  }
})

/**
 * Handle hover translation
 */
async function handleHoverTranslation(): Promise<void> {
  if (!hoveredElement) {
    showNotification('Please hover over a paragraph to translate', 'warning')
    return
  }

  if (hoveredElement.classList.contains('cpo-hover-translated')) {
    showNotification('This paragraph is already translated', 'info')
    return
  }

  const originalText = hoveredElement.textContent?.trim() || ''

  if (!originalText || originalText.length < 5) {
    showNotification('Text too short to translate', 'warning')
    return
  }

  console.log('[CPO TARS] Hover translation for:', originalText.substring(0, 50))

  isHoverTranslationActive = true

  hoveredElement.style.opacity = '0.6'
  showNotification('Translating...', 'info')

  try {
    const sentences = splitIntoSentences(originalText)
    console.log('[CPO TARS] Split into sentences:', sentences.length)

    const translations: string[] = []
    for (const sentence of sentences) {
      if (sentence.trim().length > 0) {
        const translation = await requestTranslation(sentence)
        translations.push(translation)
      } else {
        translations.push('')
      }
    }

    displaySentenceBySentence(hoveredElement, sentences, translations)

    showNotification('Translation complete', 'success')
  } catch (error) {
    console.error('[CPO TARS] Hover translation failed:', error)
    hoveredElement.style.opacity = '1'
    showNotification('Translation failed: ' + (error as Error).message, 'error')
  } finally {
    isHoverTranslationActive = false
  }
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
  text = text.trim()

  const sentenceEnders = /([.!?。！？]+[\s]*|[\n]+)/g
  const parts = text.split(sentenceEnders)
  const sentences: string[] = []

  for (let i = 0; i < parts.length; i += 2) {
    const sentence = parts[i]
    const ender = parts[i + 1] || ''

    if (sentence && sentence.trim().length > 0) {
      sentences.push((sentence + ender).trim())
    }
  }

  if (sentences.length === 0) {
    return [text]
  }

  return sentences
}

/**
 * Display sentence by sentence translation
 */
function displaySentenceBySentence(element: HTMLElement, originalSentences: string[], translatedSentences: string[]): void {
  element.classList.add('cpo-hover-translated')

  element.innerHTML = ''
  element.style.opacity = '1'

  for (let i = 0; i < originalSentences.length; i++) {
    const sentenceContainer = document.createElement('span')
    sentenceContainer.className = 'cpo-sentence-container'

    const originalSpan = document.createElement('span')
    originalSpan.className = 'cpo-sentence-original'
    originalSpan.textContent = originalSentences[i]

    const translatedSpan = document.createElement('span')
    translatedSpan.className = 'cpo-sentence-translated'
    translatedSpan.textContent = translatedSentences[i] || ''

    sentenceContainer.appendChild(originalSpan)
    sentenceContainer.appendChild(translatedSpan)

    element.appendChild(sentenceContainer)

    if (i < originalSentences.length - 1) {
      element.appendChild(document.createTextNode(' '))
    }
  }
}

/**
 * ===========================================
 * INPUT TRANSLATION - TRIPLE SPACE
 * ===========================================
 */

document.addEventListener('focusin', (e) => {
  const element = e.target as HTMLElement

  if (element.tagName === 'INPUT' ||
      element.tagName === 'TEXTAREA' ||
      element.isContentEditable) {
    currentInputElement = element as any
    console.log('[CPO TARS] Input element focused:', element.tagName)
  }
})

document.addEventListener('focusout', (e) => {
  if (e.target === currentInputElement) {
    currentInputElement = null
    spacePressTimes = []
  }
})

document.addEventListener('keydown', async (e) => {
  if (e.key === ' ' && currentInputElement) {
    const now = Date.now()

    spacePressTimes.push(now)

    if (spacePressTimes.length > 3) {
      spacePressTimes.shift()
    }

    if (spacePressTimes.length === 3) {
      const firstPress = spacePressTimes[0]
      const lastPress = spacePressTimes[2]
      const timeDiff = lastPress - firstPress

      console.log('[CPO TARS] Three spaces detected, time diff:', timeDiff + 'ms')

      if (timeDiff < 500) {
        e.preventDefault()
        spacePressTimes = []
        await handleInputTranslation()
      }
    }
  }
})

/**
 * Handle input translation
 */
async function handleInputTranslation(): Promise<void> {
  if (!currentInputElement) {
    return
  }

  let text = ''
  let isContentEditable = false

  if ((currentInputElement as HTMLElement).isContentEditable) {
    text = currentInputElement.textContent || ''
    isContentEditable = true
  } else {
    text = (currentInputElement as HTMLInputElement).value || ''
  }

  text = text.trimEnd()

  if (!text || text.length < 2) {
    showNotification('Input text too short to translate', 'warning')
    return
  }

  console.log('[CPO TARS] Translating input:', text.substring(0, 50))

  showNotification('Translating input...', 'info')

  try {
    const translation = await requestTranslation(text, 'writing')

    if (isContentEditable) {
      currentInputElement.textContent = translation

      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(currentInputElement)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    } else {
      (currentInputElement as HTMLInputElement).value = translation

      ;(currentInputElement as HTMLInputElement).selectionStart = translation.length
      ;(currentInputElement as HTMLInputElement).selectionEnd = translation.length
    }

    currentInputElement.dispatchEvent(new Event('input', { bubbles: true }))
    currentInputElement.dispatchEvent(new Event('change', { bubbles: true }))

    showNotification('✓ Translation complete', 'success')

    console.log('[CPO TARS] Input translation successful')
  } catch (error) {
    console.error('[CPO TARS] Input translation failed:', error)
    showNotification('Translation failed: ' + (error as Error).message, 'error')
  }
}

/**
 * ===========================================
 * LISTEN FOR MESSAGES FROM BACKGROUND
 * ===========================================
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[CPO TARS] Message received:', request)

  if (request.action === 'translate-page') {
    handlePageTranslation()
  }

  sendResponse({ received: true })
  return true
})

console.log('[CPO TARS] All event listeners attached ✓')
