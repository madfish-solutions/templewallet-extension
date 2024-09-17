// eslint-disable-next-line import/no-duplicates
import formatDateFns from 'date-fns/format';
// eslint-disable-next-line import/no-duplicates
import { enUS, enGB, fr, zhCN, zhTW, ja, ko, uk } from 'date-fns/locale';
import browser from 'webextension-polyfill';

import cldrjsLocales from './cldrjs-locales.json';
import {
  getNativeLocale,
  getDefaultLocale,
  areLocalesEqual,
  fetchLocaleMessages,
  applySubstitutions,
  STORAGE_KEY
} from './helpers';
import { getSavedLocale } from './saving';
import { FetchedLocaleMessages, Substitutions } from './types';

const dateFnsLocales: Record<string, Locale> = {
  en: enUS,
  en_GB: enGB,
  fr,
  zh_CN: zhCN,
  zh_TW: zhTW,
  ja,
  ko,
  uk
};

let fetchedLocaleMessages: FetchedLocaleMessages = {
  target: null,
  fallback: null
};

let cldrLocale = cldrjsLocales.en;

export async function init() {
  const saved = getSavedLocale();
  const deflt = getDefaultLocale();
  const native = getNativeLocale();

  try {
    const [target, fallback] = await Promise.all([
      !saved || areLocalesEqual(saved, native) ? null : fetchLocaleMessages(saved),
      areLocalesEqual(deflt, native) || (saved && areLocalesEqual(deflt, saved)) ? null : fetchLocaleMessages(deflt)
    ]);

    if (!target && !fallback) {
      throw new Error('Failed to fetch locale messages');
    }

    fetchedLocaleMessages = { target, fallback };
    cldrLocale = (cldrjsLocales as Record<string, any>)[getCurrentLocale()] || cldrjsLocales.en;
  } catch (e) {
    if (saved === deflt) {
      throw e;
    }

    console.error(e);
    localStorage.setItem(STORAGE_KEY, deflt);
    await init();
  }
}

export function getMessage(messageName: string, substitutions?: Substitutions) {
  const { target, fallback } = fetchedLocaleMessages;
  const targetVal = target?.[messageName];

  if (targetVal) return applySubstitutions(targetVal, substitutions);

  if (!target) {
    const nativeVal = browser.i18n.getMessage(messageName, substitutions);

    if (nativeVal) return nativeVal;
  }

  const fallbackVal = fallback?.[messageName];

  return fallbackVal
    ? applySubstitutions(fallbackVal, substitutions)
    : browser.i18n.getMessage(messageName, substitutions) ?? '';
}

export function getDateFnsLocale() {
  return dateFnsLocales[getCurrentLocale()] || enUS;
}

export function getNumberSymbols() {
  return cldrLocale.numbers['symbols-numberSystem-latn'];
}

export function getCurrentLocale() {
  return getSavedLocale() || getNativeLocale();
}

export function formatDate(date: string | number | Date, format: string) {
  const locale = getDateFnsLocale();

  return formatDateFns(new Date(date), format, { locale });
}
