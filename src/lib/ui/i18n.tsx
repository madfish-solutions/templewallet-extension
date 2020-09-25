import * as React from "react";
import { t } from "lib/i18n";

export * from "lib/i18n";

export type TProps = {
  key: string;
  substitutions?: any;
  children?: (m: string) => React.ReactElement;
};

export const T = React.memo<TProps>(({ key, substitutions, children }) => {
  const message = t(key, substitutions);
  return children ? children(message) : <>{message}</>;
});
