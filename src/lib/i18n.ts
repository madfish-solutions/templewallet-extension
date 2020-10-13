import { browser } from "webextension-polyfill-ts";

export const SUPPORTED_LOCALES = ["en", "ru"];

const { getAcceptLanguages, getUILanguage, getMessage } = browser.i18n;

export { getAcceptLanguages, getUILanguage, getMessage };

export function getUILanguageFallback() {
  const locale = getUILanguage();
  if (SUPPORTED_LOCALES.includes(locale)) {
    return locale;
  }
  const localeWithoutCountry = locale.split("_")[0];
  if (SUPPORTED_LOCALES.includes(localeWithoutCountry)) {
    return localeWithoutCountry;
  }
  return "en";
}
