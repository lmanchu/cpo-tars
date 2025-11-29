import { Storage } from "@plasmohq/storage"
import type { TranslationHistory } from "~types";

const storage = new Storage()
const MAX_HISTORY = 100;

export async function saveToHistory(record: TranslationHistory) {
    const translationHistory = await storage.get<TranslationHistory[]>('translationHistory') || [];
    const newHistory = [record, ...translationHistory].slice(0, MAX_HISTORY);
    await storage.set('translationHistory', newHistory);
}

export async function getHistory(): Promise<TranslationHistory[]> {
    return await storage.get<TranslationHistory[]>('translationHistory') || [];
}
