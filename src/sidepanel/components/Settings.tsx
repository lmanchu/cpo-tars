import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~theme/ThemeProvider';
import type { UserSettings } from '~types';

interface SettingsProps {
    settings: UserSettings;
    onUpdate: (settings: Partial<UserSettings>) => void;
}

export const Settings = ({ settings, onUpdate }: SettingsProps) => {
    const { t } = useTranslation();
    const { theme, setTheme } = useTheme();

    const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme);
        onUpdate({ theme: newTheme });
    };

    return (
        <div className="space-y-6">
            {/* Translation Settings */}
            <div className="p-4 rounded" style={{ backgroundColor: 'var(--bg-primary)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 className="font-bold mb-4 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)' }}>{t('settings.translation.title')}</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{t('settings.translation.targetLanguage')}</label>
                        <select
                            className="w-full text-sm rounded p-2"
                            style={{
                                backgroundColor: 'var(--input-bg)',
                                border: '1px solid var(--input-border)',
                                color: 'var(--text-primary)'
                            }}
                            value={settings.targetLanguage}
                            onChange={(e) => onUpdate({ targetLanguage: e.target.value })}
                        >
                            <option value="en">{t('languages.en')}</option>
                            <option value="zh-TW">{t('languages.zh-TW')}</option>
                            <option value="ja">{t('languages.ja')}</option>
                            <option value="ko">{t('languages.ko')}</option>
                            <option value="es">{t('languages.es')}</option>
                            <option value="fr">{t('languages.fr')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{t('settings.translation.translationEngine')}</label>
                        <div className="flex gap-3">
                            <button
                                className={`flex-1 py-2 px-3 text-sm rounded border ${settings.translationEngine === 'google' ? 'bg-primary-50 border-primary-500 text-primary-700 font-medium' : ''}`}
                                style={settings.translationEngine !== 'google' ? {
                                    backgroundColor: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-primary)',
                                    color: 'var(--text-secondary)'
                                } : {}}
                                onClick={() => onUpdate({ translationEngine: 'google' })}
                            >
                                {t('settings.translation.googleFree')}
                            </button>
                            <button
                                className={`flex-1 py-2 px-3 text-sm rounded border ${settings.translationEngine === 'gemini' ? 'bg-primary-50 border-primary-500 text-primary-700 font-medium' : ''}`}
                                style={settings.translationEngine !== 'gemini' ? {
                                    backgroundColor: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-primary)',
                                    color: 'var(--text-secondary)'
                                } : {}}
                                onClick={() => onUpdate({ translationEngine: 'gemini' })}
                            >
                                {t('settings.translation.gemini')}
                            </button>
                        </div>
                        {settings.translationEngine === 'google' && (
                            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{t('settings.translation.usingGoogleApi')}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Chatbot Settings */}
            <div className="p-4 rounded" style={{ backgroundColor: 'var(--bg-primary)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 className="font-bold mb-4 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)' }}>{t('settings.chatbot.title')}</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{t('settings.chatbot.engine')}</label>
                        <div className="flex gap-3">
                            <button
                                className="flex-1 py-2 px-3 text-sm rounded border bg-primary-50 border-primary-500 text-primary-700 font-medium"
                                disabled
                            >
                                {t('settings.chatbot.geminiFlash')}
                            </button>
                        </div>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{t('settings.chatbot.onlyGeminiSupported')}</p>
                    </div>

                    <div>
                        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{t('settings.chatbot.apiKey')}</label>
                        <input
                            type="password"
                            className="w-full text-sm rounded p-2"
                            style={{
                                backgroundColor: 'var(--input-bg)',
                                border: '1px solid var(--input-border)',
                                color: 'var(--text-primary)'
                            }}
                            placeholder={t('settings.chatbot.apiKeyPlaceholder')}
                            value={settings.geminiApiKey || ''}
                            onChange={(e) => onUpdate({ geminiApiKey: e.target.value })}
                        />
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            {t('settings.chatbot.getApiKey')} <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">Google AI Studio</a>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isPro"
                            checked={settings.isPro}
                            onChange={(e) => onUpdate({ isPro: e.target.checked })}
                        />
                        <label htmlFor="isPro" className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('settings.chatbot.isPro')}</label>
                    </div>
                </div>
            </div>

            {/* General Settings */}
            <div className="p-4 rounded" style={{ backgroundColor: 'var(--bg-primary)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 className="font-bold mb-4 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)' }}>{t('settings.general.title')}</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{t('settings.general.theme')}</label>
                        <select
                            className="w-full text-sm rounded p-2"
                            style={{
                                backgroundColor: 'var(--input-bg)',
                                border: '1px solid var(--input-border)',
                                color: 'var(--text-primary)'
                            }}
                            value={theme}
                            onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'system')}
                        >
                            <option value="light">{t('settings.general.light')}</option>
                            <option value="dark">{t('settings.general.dark')}</option>
                            <option value="system">{t('settings.general.system')}</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};
