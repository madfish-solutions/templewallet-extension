import { browser } from "webextension-polyfill-ts";
import { FetchedLocaleMessages, LocaleMessages, Substitutions } from "./types";
import { areLocalesEqual, processTemplate, toList } from "./helpers";
import { getSavedLocale } from "./saving";

let fetchedLocaleMessages: FetchedLocaleMessages = {
  target: null,
  fallback: null,
};

export async function init() {
  const refetched: FetchedLocaleMessages = {
    target: null,
    fallback: null,
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
      })(),
    ]);
  }

  fetchedLocaleMessages = refetched;
}

export function getMessage(messageName: string, substitutions?: Substitutions) {
  const val =
    fetchedLocaleMessages.target?.[messageName] ??
    fetchedLocaleMessages.fallback?.[messageName];

  if (!val) {
    return browser.i18n.getMessage(messageName, substitutions);
  }

  try {
    if (val.placeholders) {
      const params = toList(substitutions).reduce((prms, sub, i) => {
        const pKey = val.placeholderList?.[i] ?? i;
        return pKey ? { ...prms, [pKey]: sub } : prms;
      }, {});

      return processTemplate(val.message, params);
    }

    return val.message;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }

    return "";
  }
}

export function getCurrentLocale() {
  return getSavedLocale() || getNativeLocale();
}

export function getNativeLocale() {
  return browser.i18n.getUILanguage();
}

export function getDefaultLocale(): string {
  const manifest = browser.runtime.getManifest();
  return (manifest as any).default_locale || "en";
}

export async function fetchLocaleMessages(locale: string) {
  const dirName = locale.replace("-", "_");
  const url = browser.runtime.getURL(`_locales/${dirName}/messages.json`);

  try {
    const res = await fetch(url);
    const messages: LocaleMessages = await res.json();

    appendPlaceholderLists(messages);
    return messages;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }

    return null;
  }
}

function appendPlaceholderLists(messages: LocaleMessages) {
  for (const name in messages) {
    const val = messages[name];
    if (val.placeholders) {
      val.placeholderList = [];
      for (const pKey in val.placeholders) {
        const { content } = val.placeholders[pKey];
        const index = +content.substring(1) - 1;
        val.placeholderList[index] = pKey;
      }
    }
  }
}
