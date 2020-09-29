import * as React from "react";
import { t } from "lib/i18n";

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

  if (process.env.NODE_ENV === "development" && !t(name)) {
    console.error(`could not find translation for key ${name}`);
  }

  return children ? children(message) : <>{message}</>;
});

function isBrowserI18nCompatibleSubstitutions(
  substitutions: TProps["substitutions"]
): substitutions is BrowserI18nCompatibleSubstitutions {
  return (
    !substitutions ||
    typeof substitutions === "string" ||
    substitutions.every((sub) => typeof sub === "string")
  );
}
