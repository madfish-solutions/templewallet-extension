import { browser } from "webextension-polyfill-ts";

const {
  getAcceptLanguages: importedGetAcceptLanguages,
  getMessage,
  getUILanguage: importedGetUILanguage,
} = browser.i18n;

// TODO: add signatures which would provide 'substitutions' argument type control
export function t(messageName: string, substitutions?: any) {
  return getMessage(messageName, substitutions);
}

export const getAcceptLanguages = importedGetAcceptLanguages;
export const getUILanguage = importedGetUILanguage;
