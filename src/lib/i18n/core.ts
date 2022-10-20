import { enUS, enGB, fr, zhCN, zhTW, ja, ko, uk, ru } from 'date-fns/locale';
import browser from 'webextension-polyfill';

import cldrjsLocales from './cldrjs-locales.json';
import { getNativeLocale, getDefaultLocale, areLocalesEqual, fetchLocaleMessages, applySubstitutions } from './helpers';
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
  uk,
  ru
};

let fetchedLocaleMessages: FetchedLocaleMessages = {
  target: null,
  fallback: null
};

let cldrLocale = cldrjsLocales.en;

export async function init() {
  const refetched: FetchedLocaleMessages = {
    target: null,
    fallback: null
  };

  const saved = getSavedLocale();

  if (saved) {
    const native = getNativeLocale();

    await Promise.all([
      // Fetch target locale messages if needed
      (async () => {
        if (!areLocalesEqual(saved, native)) {
          refetched.target = await fetchLocaleMessages(saved);
        }
      })(),
      // Fetch fallback locale messages if needed
      (async () => {
        const deflt = getDefaultLocale();
        if (!areLocalesEqual(deflt, native) && !areLocalesEqual(deflt, saved)) {
          refetched.fallback = await fetchLocaleMessages(deflt);
        }
      })()
    ]);
  }

  fetchedLocaleMessages = refetched;
  cldrLocale = (cldrjsLocales as Record<string, any>)[getCurrentLocale()] || cldrjsLocales.en;
}

export function getMessage(messageName: string, substitutions?: Substitutions) {
  const val = fetchedLocaleMessages.target?.[messageName] ?? fetchedLocaleMessages.fallback?.[messageName];

  if (val) return applySubstitutions(val, substitutions);

  return browser.i18n.getMessage(messageName, substitutions);
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
