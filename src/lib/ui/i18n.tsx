import { enUS, enGB, ru } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import { ThanosSharedStorageKey, useStorage } from "lib/thanos/front";
import {
  getMessage,
  addLocalesChangedListener,
  removeLocalesChangedListener,
  LocalesMessages,
  getLocalesMessages,
} from "lib/i18n";

export * from "lib/i18n";

const dateFnsLocales: Record<string, Locale> = {
  en: enUS,
  en_US: enUS,
  en_GB: enGB,
  ru,
};
export const useTranslation = () => {
  const [locale] = useStorage(ThanosSharedStorageKey.LocaleCode, "en");
  const [localesMessages, setLocalesMessages] = useState<LocalesMessages>(
    getLocalesMessages()
  );

  useEffect(() => {
    addLocalesChangedListener(setLocalesMessages);
    return () => removeLocalesChangedListener(setLocalesMessages);
  }, []);

  return {
    locale,
    localesMessages,
    t: getMessage,
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
    const { t, localesMessages } = useTranslation();
    const [message, setMessage] = useState<React.ReactElement | string | null>(
      t(id, substitutions, forceUseBreaks)
    );

    useEffect(() => {
      setMessage(t(id, substitutions, forceUseBreaks));
    }, [t, localesMessages, id, substitutions, forceUseBreaks]);

    return children ? children(message) : <>{message}</>;
  }
);
