/*
  (!) BG scripts are only allowed to import this module from this folder.

  (!) Keep it from dependance on './loading'
*/

import { browser } from 'webextension-polyfill-ts';

import { getNativeLocale, getDefaultLocale, areLocalesEqual, fetchLocaleMessages, applySubstitutions } from './helpers';
import { asyncGetSavedLocale } from './saving';
import type { TID, Substitutions } from './types';

/**
 * Fetching one message at a time.
 */
export async function fetchMessage(msgId: TID, substitutions?: Substitutions) {
  const savedLocale = await asyncGetSavedLocale();

  const nativeLocale = getNativeLocale();

  let result: string | null = null;

  // primary source

  if (!savedLocale || areLocalesEqual(savedLocale, nativeLocale))
    result = browser.i18n.getMessage(msgId, substitutions);
  else {
    result = await _fetchAllGetOneLocaleMessageStr(savedLocale, msgId, substitutions);
  }

  if (result) return result;

  // secondary (fallback, default) source

  const defltLocale = getDefaultLocale();

  if (savedLocale) {
    if (areLocalesEqual(defltLocale, savedLocale)) return '';
    if (areLocalesEqual(savedLocale, nativeLocale)) return '';
  } else if (areLocalesEqual(defltLocale, nativeLocale)) return '';

  result = await _fetchAllGetOneLocaleMessageStr(defltLocale, msgId, substitutions);

  return result || '';
}

async function _fetchAllGetOneLocaleMessageStr(locale: string, msgId: string, substitutions?: Substitutions) {
  const messages = await fetchLocaleMessages(locale);
  const val = messages ? messages[msgId] : null;
  return val ? applySubstitutions(val, substitutions) : null;
}
