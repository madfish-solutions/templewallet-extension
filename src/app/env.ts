import * as React from "react";
import createUseContext from "constate";
import { browser } from "webextension-polyfill-ts";
import { createUrl } from "lib/woozie";

export type AppEnvironment = {
  windowType: WindowType;
};

export enum WindowType {
  Popup,
  FullPage
}

export const useAppEnvContext = createUseContext((env: AppEnvironment) => env);

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
    url: browser.runtime.getURL(url)
  });
}
