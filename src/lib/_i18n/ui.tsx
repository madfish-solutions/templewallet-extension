import { enUS, enGB, ru } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import { ThanosSharedStorageKey, useStorage } from "lib/thanos/front";
import {
  getMessage,
  addLocalesChangedListener,
  removeLocalesChangedListener,
  TranslationFn,
} from "./index";

export * from "./index";

const dateFnsLocales: Record<string, Locale> = {
  en: enUS,
  en_US: enUS,
  en_GB: enGB,
  ru,
};
type FunctionArgs<T> = T extends (...args: infer U) => unknown ? U : never;
export const useTranslation = () => {
  const [locale] = useStorage(ThanosSharedStorageKey.LocaleCode, "en");
  const [{ t }, setTranslationFnWrapper] = useState({ t: getMessage });

  useEffect(() => {
    const callback = () =>
      setTranslationFnWrapper({
        t: ((...args: FunctionArgs<TranslationFn>) =>
          getMessage(...args)) as TranslationFn,
      });
    addLocalesChangedListener(callback);
    return () => removeLocalesChangedListener(callback);
  }, []);

  return {
    locale,
    t,
    dateFnsLocale: dateFnsLocales[locale] || enUS,
  };
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
    const [message, setMessage] = useState<React.ReactElement | string | null>(
      t(id, substitutions, forceUseBreaks)
    );

    useEffect(() => {
      setMessage(t(id, substitutions, forceUseBreaks));
    }, [t, id, substitutions, forceUseBreaks]);

    return children ? children(message) : <>{message}</>;
  }
);
