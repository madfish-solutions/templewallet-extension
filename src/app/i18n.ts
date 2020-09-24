import { browser } from "webextension-polyfill-ts";

export enum I18nKeys {
  CREATE_ACCOUNT = "createAccount",
  IMPORT_ACCOUNT = "importAccount",
  IMPORT_FAUCET_FILE = "importFaucetFile",
  SETTINGS = "settings",
  OPEN_NEW_TAB = "openNewTab",
  MAXIMISE_VIEW = "maximiseView",
}

const {
  getAcceptLanguages: importedGetAcceptLanguages,
  getMessage: untypedGetMessage,
  getUILanguage: importedGetUILanguage,
} = browser.i18n;

// TODO: add signatures which would provide 'substitutions' argument type control
export function getMessage(messageName: I18nKeys, substitutions?: any) {
  return untypedGetMessage(messageName, substitutions);
}

export const getAcceptLanguages = importedGetAcceptLanguages;
export const getUILanguage = importedGetUILanguage;
