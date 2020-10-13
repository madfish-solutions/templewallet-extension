import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ThanosSharedStorageKey, useStorage } from "lib/thanos/front";
import { supportedLocales } from "lib/i18n";

export * from "lib/i18n";

type BrowserI18nCompatibleSubstitutions = string | string[] | undefined;
export type TProps = {
  name: string;
  substitutions?: any;
  children?: (m: React.ReactElement | string | null) => React.ReactElement;
};

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

const fallbackLocale = "en";
const useLocalesMessages = () => {
  const [locale] = useStorage(ThanosSharedStorageKey.LocaleCode, "en");
  const [localeMessages, setLocaleMessages] = useState<LocalesMessages>({});
  useEffect(() => {
    Promise.all([
      (() => {
        if (supportedLocales.includes(locale)) {
          return fetch(`./_locales/${locale}/messages.json`);
        }
        const localeWithoutCountry = locale.split("_")[0];
        if (supportedLocales.includes(localeWithoutCountry)) {
          return fetch(`./_locales/${localeWithoutCountry}/messages.json`);
        }
        return undefined;
      })(),
      fetch(`./_locales/${fallbackLocale}/messages.json`),
    ])
      .then((responses) => Promise.all(responses.map((res) => res?.json())))
      .then(([currentLocaleMessages, fallbackMessages]) =>
        setLocaleMessages({
          current: currentLocaleMessages,
          fallback: fallbackMessages,
        })
      );
  }, [locale]);
  return localeMessages;
};

const placeholderRegex = /\$[a-z0-9_@]+\$/gi;
const contentDescriptorRegex = /^\$[0-9]+$/;
export const useTranslation = () => {
  const [locale] = useStorage(ThanosSharedStorageKey.LocaleCode, "en");
  const { current, fallback } = useLocalesMessages();
  console.log(current, fallback);

  const t = useCallback(
    (name: string, substitutions?: any) => {
      const normalizedSubstitutions = (() => {
        if (substitutions == null) {
          return [];
        }
        if (!(substitutions instanceof Array)) {
          return [substitutions];
        }
        return substitutions;
      })();

      console.log(name);
      const messageDescriptor = current?.[name] || fallback?.[name];
      if (!messageDescriptor && process.env.NODE_ENV === "development") {
        console.error(`Missing translation for key ${name}`);
      }
      if (!messageDescriptor) {
        return null;
      }

      const resultShouldBeString = normalizedSubstitutions.every((value) => {
        return typeof value === "string" || typeof value === "number";
      });
      let result: string | React.ReactChild[] = resultShouldBeString ? "" : [];
      const appendPart = (part: string | React.ReactChild[]) => {
        if (typeof result === "string") {
          result = result.concat(part as string);
        } else {
          result.push(...(part as React.ReactChild[]));
        }
      };

      const messageLines = messageDescriptor.message.split("\n");
      messageLines.forEach((line, index) => {
        console.log("line", line);
        let prevIndex = 0;
        let prevEntryLength = 0;
        let placeholderEntry = placeholderRegex.exec(line);
        while (placeholderEntry) {
          console.log("iteration", placeholderEntry);
          const currentIndex = placeholderEntry.index;
          console.log("new part", line.substring(prevIndex, currentIndex));
          appendPart(line.substring(prevIndex, currentIndex));
          const placeholderStr = placeholderEntry[0];
          const placeholderName = placeholderStr.substring(
            1,
            placeholderStr.length - 1
          );
          const contentDescriptor = messageDescriptor!.placeholders?.[
            placeholderName
          ]?.content;
          console.log(placeholderName, contentDescriptor);
          const substitutionIndex =
            contentDescriptor && contentDescriptorRegex.test(contentDescriptor)
              ? +contentDescriptor.substring(1)
              : -1;
          const substitution = normalizedSubstitutions[substitutionIndex];
          console.log(substitutionIndex, normalizedSubstitutions);
          appendPart(substitution != null ? substitution : placeholderStr);
          prevEntryLength = placeholderStr.length;
          prevIndex = currentIndex;
          placeholderEntry = placeholderRegex.exec(line);
        }
        const finalPart = line.substring(prevIndex + prevEntryLength);
        console.log("final part", finalPart);
        const isLastLine = index === messageLines.length - 1;
        if (typeof result === "string") {
          result = `${result.concat(finalPart)}${isLastLine ? "" : "\n"}`;
        } else {
          result.push(finalPart);
          if (!isLastLine) {
            result.push(<br />);
          }
        }
      });
      return typeof result === "string" ? result : <>{result}</>;
    },
    [current, fallback]
  );

  return { locale, t };
};

export const T = React.memo<TProps>(({ name, substitutions, children }) => {
  const { t } = useTranslation();
  const message = useMemo(() => t(name, substitutions), [
    t,
    name,
    substitutions,
  ]);

  return children ? children(message) : <>{message}</>;
});
