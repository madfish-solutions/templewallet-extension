import browser from 'webextension-polyfill';

import type { LocaleMessage, LocaleMessages, Substitutions } from './types';

const TEMPLATE_RGX = /\$(.*?)\$/g;

export function getNativeLocale() {
  return browser.i18n.getUILanguage();
}

export function getDefaultLocale(): string {
  const manifest = browser.runtime.getManifest();
  return (manifest as any).default_locale || 'en';
}

export function areLocalesEqual(a: string, b: string) {
  return a === b || a === b.split('-')[0];
}

export function toList<T, U>(term: T | U[]): (T | U)[] {
  return Array.isArray(term) ? term : [term];
}

export async function fetchLocaleMessages(locale: string) {
  const dirName = locale.replace('-', '_');
  const url = browser.runtime.getURL(`_locales/${dirName}/messages.json`);

  try {
    const res = await fetch(url);
    const messages: LocaleMessages = await res.json();

    appendPlaceholderLists(messages);
    return messages;
  } catch (err: any) {
    console.error(err);

    return null;
  }
}

function appendPlaceholderLists(messages: LocaleMessages) {
  for (const name in messages) {
    const val = messages[name];
    const placeholders = val.placeholders;
    if (placeholders) {
      val.placeholderList = [];
      for (const pKey in val.placeholders) {
        const index = +val.placeholders[pKey].content.substring(1) - 1;
        val.placeholderList[index] = pKey;
      }
    }
  }
}

export function applySubstitutions(value: LocaleMessage, substitutions?: Substitutions) {
  try {
    if (value.placeholders) {
      const params = toList(substitutions).reduce((prms, sub, i) => {
        const pKey = value.placeholderList?.[i] ?? i;
        return pKey ? { ...prms, [pKey]: sub } : prms;
      }, {});

      return processTemplate(value.message, params);
    }

    return value.message;
  } catch (err: any) {
    console.error(err);

    return '';
  }
}

function processTemplate(str: string, mix: any) {
  return str.replace(TEMPLATE_RGX, (_: any, key) => {
    let x = 0;
    let y = mix;
    key = key.trim().split('.');
    while (y && x < key.length) {
      y = y[key[x++]];
    }
    return y != null ? y : '';
  });
}
