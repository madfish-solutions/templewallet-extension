import React from "react";
import { browser } from "webextension-polyfill-ts";
import { ThanosSharedStorageKey } from "lib/thanos/types";

export const SUPPORTED_LOCALES = ["en", "ru"];
export const DEFAULT_LOCALE = ["en"];
const STORAGE_KEY = ThanosSharedStorageKey.LocaleCode;

const { getAcceptLanguages, getUILanguage } = browser.i18n;

export { getAcceptLanguages, getUILanguage };

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

export type LocaleMessage = {
  message: string;
  description?: string;
  placeholders?: Record<string, { content: string }>;
};

export type LocaleMessages = Record<string, LocaleMessage>;

export type LocalesMessages = {
  current?: LocaleMessages;
  fallback?: LocaleMessages;
};

type LocalesChangedListener = (newLocales: LocalesMessages) => void;

let localesMessages: LocalesMessages = {};
let localesChangedListeners: LocalesChangedListener[] = [];

export async function getCurrentLocale() {
  return (await browser.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || "en";
}
export function getLocalesMessages() {
  return localesMessages;
}
export function addLocalesChangedListener(listener: LocalesChangedListener) {
  localesChangedListeners.push(listener);
}
export function removeLocalesChangedListener(listener: LocalesChangedListener) {
  localesChangedListeners = localesChangedListeners.filter(
    (value) => value !== listener
  );
}
export async function updateLocalesMessages() {
  try {
    const locale = await getCurrentLocale();
    localesMessages = await Promise.all([
      (() => {
        if (SUPPORTED_LOCALES.includes(locale)) {
          return fetch(`./_locales/${locale}/messages.json`);
        }
        const localeWithoutCountry = locale.split("_")[0];
        if (SUPPORTED_LOCALES.includes(localeWithoutCountry)) {
          return fetch(`./_locales/${localeWithoutCountry}/messages.json`);
        }
        return undefined;
      })(),
      fetch(`./_locales/${DEFAULT_LOCALE}/messages.json`),
    ])
      .then((responses) => Promise.all(responses.map((res) => res?.json())))
      .then(([currentLocaleMessages, fallbackMessages]) => ({
        current: currentLocaleMessages,
        fallback: fallbackMessages,
      }));
    localesChangedListeners.forEach((listener) => listener(localesMessages));
  } catch (e) {
    console.error(e);
  }
}

const PLACEHOLDER_REGEX = /\$[a-z0-9_@]+\$/gi;
const CONTENT_DESCRIPTOR_REGEX = /^\$[0-9]+$/;
type PlainSubstitutions = (string | number)[] | string | number;
export type TranslationFn = typeof getMessage;
export function getMessage(
  name: string,
  substitutions?: PlainSubstitutions,
  forceUseBreaks?: false
): string;
export function getMessage(
  name: string,
  substitutions: PlainSubstitutions | undefined,
  forceUseBreaks: true
): React.ReactElement | null;
export function getMessage(
  name: string,
  substitutions: React.ReactElement[],
  forceUseBreaks?: boolean
): React.ReactElement | null;
export function getMessage(
  name: string,
  substitutions?: any,
  forceUseBreaks?: boolean
): string | React.ReactElement | null {
  const { current, fallback } = localesMessages;
  const normalizedSubstitutions = (() => {
    if (substitutions == null) {
      return [];
    }
    if (!(substitutions instanceof Array)) {
      return [substitutions];
    }
    return substitutions;
  })();

  if (!current && !fallback) {
    return browser.i18n.getMessage(name, substitutions);
  }

  const resultShouldBeString =
    normalizedSubstitutions.every((value) => {
      return typeof value === "string" || typeof value === "number";
    }) && !forceUseBreaks;
  const messageDescriptor = current?.[name] || fallback?.[name];
  if (!messageDescriptor && process.env.NODE_ENV === "development") {
    console.error(`Missing translation for key ${name}`);
  }
  if (!messageDescriptor) {
    return resultShouldBeString ? "" : null;
  }

  let result: string | React.ReactChild[] = resultShouldBeString ? "" : [];
  const appendPart = (part: string | React.ReactChild | React.ReactChild[]) => {
    if (typeof result === "string") {
      result = result.concat(part as string);
    } else if (part instanceof Array) {
      result.push(...(part as React.ReactChild[]));
    } else {
      result.push(part);
    }
  };
  const messageLines = messageDescriptor.message.split("\n");
  messageLines.forEach((line, index) => {
    let prevIndex = 0;
    let prevEntryLength = 0;
    let placeholderEntry = PLACEHOLDER_REGEX.exec(line);
    while (placeholderEntry) {
      const currentIndex = placeholderEntry.index;
      appendPart(line.substring(prevIndex + prevEntryLength, currentIndex));
      const placeholderStr = placeholderEntry[0];
      const placeholderName = placeholderStr.substring(
        1,
        placeholderStr.length - 1
      );
      const contentDescriptor = messageDescriptor!.placeholders?.[
        placeholderName
      ]?.content;
      const substitutionIndex =
        contentDescriptor && CONTENT_DESCRIPTOR_REGEX.test(contentDescriptor)
          ? +contentDescriptor.substring(1) - 1
          : -1;
      const substitution = normalizedSubstitutions[substitutionIndex];
      const normalizedSubstitution =
        typeof substitution === "number" ? String(substitution) : substitution;
      appendPart(
        normalizedSubstitution != null ? normalizedSubstitution : placeholderStr
      );
      prevEntryLength = placeholderStr.length;
      prevIndex = currentIndex;
      placeholderEntry = PLACEHOLDER_REGEX.exec(line);
    }
    const finalPart = line.substring(prevIndex + prevEntryLength);
    const isLastLine = index === messageLines.length - 1;
    appendPart(finalPart);
    if (!isLastLine) {
      appendPart(
        typeof result === "string" ? (
          "\n"
        ) : (
          <br key={`${index}-${result.length}`} />
        )
      );
    }
  });
  return typeof result === "string" ? result : <>{result}</>;
}

updateLocalesMessages();
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && Object.keys(changes).includes(STORAGE_KEY)) {
    updateLocalesMessages();
  }
});
