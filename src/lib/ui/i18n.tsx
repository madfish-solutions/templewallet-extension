import * as React from "react";
import { t } from "lib/i18n";

export * from "lib/i18n";

export type TProps = {
  name: string;
  substitutions?: any;
  children?: (m: string) => React.ReactElement;
};

export const T = React.memo<TProps>(({ name, substitutions, children }) => {
  const message = t(name, substitutions);
  return children ? children(message) : <>{message}</>;
});
