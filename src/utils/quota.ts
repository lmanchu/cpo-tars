import { Storage } from "@plasmohq/storage"
import { FREE_TRANSLATION_QUOTA } from "~constants";

const storage = new Storage()

export async function checkTranslationQuota(): Promise<{
    used: number;
    limit: number;
    canTranslate: boolean;
}> {
    const isPro = await storage.get<boolean>('isPro');

    if (isPro) {
        return { used: 0, limit: Infinity, canTranslate: true };
    }

    const today = new Date().toDateString();
    const lastReset = await storage.get<string>('lastReset');

    if (today !== lastReset) {
        // Reset quota for new day
        await storage.set('translationQuota', 0);
        await storage.set('lastReset', today);
        return { used: 0, limit: FREE_TRANSLATION_QUOTA, canTranslate: true };
    }

    const used = await storage.get<number>('translationQuota') || 0;
    return {
        used,
        limit: FREE_TRANSLATION_QUOTA,
        canTranslate: used < FREE_TRANSLATION_QUOTA
    };
}

export async function incrementQuota() {
    const used = await storage.get<number>('translationQuota') || 0;
    await storage.set('translationQuota', used + 1);
}
