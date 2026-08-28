import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import zh from './locales/zh.json';

export const LANGUAGE_STORAGE_KEY = 'appLanguage';
export type AppLanguage = 'en' | 'zh';

let cachedLanguage: AppLanguage = 'en';

export function getCachedLanguage(): AppLanguage {
  return cachedLanguage;
}

export async function resolveStoredLanguage(): Promise<AppLanguage> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'zh' || stored === 'en') {
      cachedLanguage = stored;
      return stored;
    }
  } catch {
    // ignore storage errors
  }
  return 'en';
}

export async function persistLanguage(lng: AppLanguage): Promise<void> {
  cachedLanguage = lng;
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  } catch {
    // ignore storage errors
  }
}

export function dateLocale(lng: string = i18n.language): string {
  return lng?.startsWith('zh') ? 'zh-TW' : 'en-US';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

/** Load persisted language before first paint when possible. */
export async function initI18n(): Promise<typeof i18n> {
  const lng = await resolveStoredLanguage();
  if (lng !== i18n.language) {
    await i18n.changeLanguage(lng);
  }
  return i18n;
}

export default i18n;
