import * as React from "react";
import constate from "constate";
import { browser } from "webextension-polyfill-ts";
import { createUrl } from "lib/woozie";

export type AppEnvironment = {
  windowType: WindowType;
};

export enum WindowType {
  Popup,
  FullPage,
}

export const [AppEnvProvider, useAppEnv] = constate((env: AppEnvironment) => {
  const fullPage = env.windowType === WindowType.FullPage;
  const popup = env.windowType === WindowType.Popup;

  return React.useMemo(() => ({ ...env, fullPage, popup }), [
    env,
    fullPage,
    popup,
  ]);
});

export const OpenInFullPage: React.FC = () => {
  React.useEffect(() => {
    openInFullPage();
  }, []);

  return null;
};

export function openInFullPage() {
  const { search, hash } = window.location;
  const url = createUrl("fullpage.html", search, hash);
  browser.tabs.create({
    url: browser.runtime.getURL(url),
  });
}
