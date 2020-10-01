import enUS from "date-fns/locale/en-US";
import enGB from "date-fns/locale/en-GB";
import * as React from "react";
import { t } from "lib/i18n";
import { browser } from "webextension-polyfill-ts";

export * from "lib/i18n";

type BrowserI18nCompatibleSubstitutions = string | string[] | undefined;
export type TProps = {
  name: string;
  substitutions?: BrowserI18nCompatibleSubstitutions | React.ReactChild[];
  children?: (m: React.ReactChild) => React.ReactElement;
};

export const T = React.memo<TProps>(({ name, substitutions, children }) => {
  const message = isBrowserI18nCompatibleSubstitutions(substitutions) ? (
    t(name, substitutions)
  ) : (
    <>
      {t(name)
        ?.split(/%[a-z0-9_]+%/i)
        .map((fragment, index) => (
          <React.Fragment key={index}>
            {fragment}
            {substitutions[index]}
          </React.Fragment>
        ))}
    </>
  );

  return children ? children(message) : <>{message}</>;
});

const availableNonDefaultLocales: Record<string, Locale> = {
  en_GB: enGB,
};
export const getDateFnsLocale = () =>
  availableNonDefaultLocales[browser.i18n.getUILanguage()] || enUS;

function isBrowserI18nCompatibleSubstitutions(
  substitutions: TProps["substitutions"]
): substitutions is BrowserI18nCompatibleSubstitutions {
  return (
    !substitutions ||
    typeof substitutions === "string" ||
    substitutions.every((sub) => typeof sub === "string")
  );
}
