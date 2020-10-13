import { browser } from "webextension-polyfill-ts";

const {
  getAcceptLanguages: importedGetAcceptLanguages,
  getUILanguage: importedGetUILanguage,
  getMessage: importedGetMessage,
} = browser.i18n;

export const supportedLocales = ["en", "ru"];
export const getAcceptLanguages = importedGetAcceptLanguages;
export const getUILanguage = importedGetUILanguage;
export const getMessage = importedGetMessage;
export const getUILanguageFallback = () => {
  const locale = getUILanguage();
  if (supportedLocales.includes(locale)) {
    return locale;
  }
  const localeWithoutCountry = locale.split("_")[0];
  if (supportedLocales.includes(localeWithoutCountry)) {
    return localeWithoutCountry;
  }
  return "en";
};
