import { browser } from "webextension-polyfill-ts";
import { enUS, enGB } from "date-fns/locale";

const {
  getAcceptLanguages: importedGetAcceptLanguages,
  getMessage,
  getUILanguage: importedGetUILanguage,
} = browser.i18n;

// TODO: add signatures which would provide 'substitutions' argument type control
export function t(messageName: string, substitutions?: string | string[]) {
  const message = getMessage(messageName, substitutions);
  if (!message && process.env.NODE_ENV === "development") {
    console.error(`Missing translation for key ${messageName}`);
  }
  return message;
}

export const getAcceptLanguages = importedGetAcceptLanguages;
export const getUILanguage = importedGetUILanguage;

const dateFnsLocales: Record<string, Locale> = {
  en: enUS,
  en_US: enUS,
  en_GB: enGB,
};

export const getDateFnsLocale = () => dateFnsLocales[getUILanguage()];
