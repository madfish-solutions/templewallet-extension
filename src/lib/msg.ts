import { browser } from 'lib/browser';

export const msg = (key: string, substitutions?: string | string[]) =>
  browser.i18n.getMessage(key, substitutions) || key;
