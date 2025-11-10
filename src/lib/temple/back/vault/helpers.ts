import browser from 'webextension-polyfill';

// (!) Only importing from `lib/i18n/${'helpers' | 'types'}` directly here
import {
  asyncGetSavedLocale,
  getNativeLocale,
  getDefaultLocale,
  areLocalesEqual,
  fetchLocaleMessages,
  applySubstitutions
} from 'lib/i18n/helpers';
import type { TID, Substitutions } from 'lib/i18n/types';

export async function fetchMessage(msgId: TID, substitutions?: Substitutions) {
  const savedLocale = await asyncGetSavedLocale();
  const nativeLocale = getNativeLocale();

  let result: string | null = null;

  // primary source

  if (!savedLocale || areLocalesEqual(savedLocale, nativeLocale))
    result = browser.i18n.getMessage(msgId, substitutions);
  else {
    result = await fetchAllGetOneLocaleMessageStr(savedLocale, msgId, substitutions);
  }

  if (result) return result;

  // secondary (fallback, default) source

  const defltLocale = getDefaultLocale();

  if (savedLocale) {
    if (areLocalesEqual(defltLocale, savedLocale)) return '';
    if (areLocalesEqual(savedLocale, nativeLocale)) return '';
  } else if (areLocalesEqual(defltLocale, nativeLocale)) return '';

  result = await fetchAllGetOneLocaleMessageStr(defltLocale, msgId, substitutions);

  return result || '';
}

async function fetchAllGetOneLocaleMessageStr(locale: string, msgId: string, substitutions?: Substitutions) {
  const messages = await fetchLocaleMessages(locale);
  const val = messages ? messages[msgId] : null;
  return val ? applySubstitutions(val, substitutions) : null;
}
