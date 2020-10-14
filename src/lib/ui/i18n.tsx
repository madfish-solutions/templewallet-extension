import { enUS, enGB, ru } from "date-fns/locale";
import React, { ReactElement, useCallback, useMemo } from "react";
import { ThanosSharedStorageKey, useStorage } from "lib/thanos/front";
import { SUPPORTED_LOCALES, getMessage } from "lib/i18n";
import { useRetryableSWR } from "lib/swr";

export * from "lib/i18n";

export type LocaleMessages = Record<
  string,
  {
    message: string;
    description?: string;
    placeholders?: Record<string, { content: string }>;
  }
>;

export type LocalesMessages = {
  current?: LocaleMessages;
  fallback?: LocaleMessages;
};

const fetchMessages = (_k: string, locale: string) => {
  return Promise.all([
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
    fetch(`./_locales/${fallbackLocale}/messages.json`),
  ])
    .then((responses) => Promise.all(responses.map((res) => res?.json())))
    .then(([currentLocaleMessages, fallbackMessages]) => ({
      current: currentLocaleMessages,
      fallback: fallbackMessages,
    }));
};

const fallbackLocale = "en";
const useLocalesMessages = () => {
  const [locale] = useStorage(ThanosSharedStorageKey.LocaleCode, "en");
  const { data = {} } = useRetryableSWR<LocalesMessages>(
    ["fetch-messages", locale],
    fetchMessages
  );

  return data;
};

type PlainSubstitutions = (string | number)[] | string | number;

type TranslationFunction = ((
  name: string,
  substitutions?: PlainSubstitutions,
  forceUseBreaks?: false
) => string) &
  ((
    name: string,
    substitutions?: PlainSubstitutions,
    forceUseBreaks?: true
  ) => React.ReactElement) &
  ((
    name: string,
    substitutions: React.ReactElement[],
    forceUseBreaks?: boolean
  ) => React.ReactElement);

const dateFnsLocales: Record<string, Locale> = {
  en: enUS,
  en_US: enUS,
  en_GB: enGB,
  ru,
};
const placeholderRegex = /\$[a-z0-9_@]+\$/gi;
const contentDescriptorRegex = /^\$[0-9]+$/;
export const useTranslation = () => {
  const [locale] = useStorage(ThanosSharedStorageKey.LocaleCode, "en");
  const { current, fallback } = useLocalesMessages();

  const t = useCallback<TranslationFunction>(
    // @ts-ignore
    (
      name: string,
      substitutions: (string | number | ReactElement)[],
      forceUseBreaks?: boolean
    ) => {
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
        return getMessage(name, substitutions);
      }

      const messageDescriptor = current?.[name] || fallback?.[name];
      if (!messageDescriptor && process.env.NODE_ENV === "development") {
        console.error(`Missing translation for key ${name}`);
      }
      if (!messageDescriptor) {
        return null;
      }

      const resultShouldBeString =
        normalizedSubstitutions.every((value) => {
          return typeof value === "string" || typeof value === "number";
        }) && !forceUseBreaks;
      let result: string | React.ReactChild[] = resultShouldBeString ? "" : [];
      const appendPart = (
        part: string | React.ReactChild | React.ReactChild[]
      ) => {
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
        let placeholderEntry = placeholderRegex.exec(line);
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
            contentDescriptor && contentDescriptorRegex.test(contentDescriptor)
              ? +contentDescriptor.substring(1) - 1
              : -1;
          const substitution = normalizedSubstitutions[substitutionIndex];
          const normalizedSubstitution =
            typeof substitution === "number"
              ? String(substitution)
              : substitution;
          appendPart(
            normalizedSubstitution != null
              ? normalizedSubstitution
              : placeholderStr
          );
          prevEntryLength = placeholderStr.length;
          prevIndex = currentIndex;
          placeholderEntry = placeholderRegex.exec(line);
        }
        const finalPart = line.substring(prevIndex + prevEntryLength);
        const isLastLine = index === messageLines.length - 1;
        if (typeof result === "string") {
          result = `${result.concat(finalPart)}${isLastLine ? "" : "\n"}`;
        } else {
          result.push(finalPart);
          if (!isLastLine) {
            result.push(<br key={result.length} />);
          }
        }
      });
      return typeof result === "string" ? result : <>{result}</>;
    },
    [current, fallback]
  );

  return { locale, t, dateFnsLocale: dateFnsLocales[locale] || enUS };
};

export type TProps = {
  id: string;
  substitutions?: any;
  forceUseBreaks?: boolean;
  children?: (m: React.ReactElement | string | null) => React.ReactElement;
};

export const T = React.memo<TProps>(
  ({ id, substitutions, forceUseBreaks = true, children }) => {
    const { t } = useTranslation();
    const message = useMemo(() => t(id, substitutions, forceUseBreaks), [
      t,
      id,
      substitutions,
      forceUseBreaks,
    ]);

    return children ? children(message) : <>{message}</>;
  }
);
