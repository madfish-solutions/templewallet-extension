import { FC, useCallback, useLayoutEffect, useRef } from "react";

import constate from "constate";
import { browser } from "webextension-polyfill-ts";

import { createUrl } from "lib/woozie";

export type AppEnvironment = {
  windowType: WindowType;
  confirmWindow?: boolean;
};

export enum WindowType {
  Popup,
  FullPage,
}

export type BackHandler = () => void;

export const [AppEnvProvider, useAppEnv] = constate((env: AppEnvironment) => {
  const fullPage = env.windowType === WindowType.FullPage;
  const popup = env.windowType === WindowType.Popup;
  const confirmWindow = env.confirmWindow ?? false;

  const handlerRef = useRef<BackHandler>();
  const prevHandlerRef = useRef<BackHandler>();

  const onBack = useCallback(() => {
    if (handlerRef.current) {
      handlerRef.current();
    }
  }, []);

  const registerBackHandler = useCallback((handler: BackHandler) => {
    if (handlerRef.current) {
      prevHandlerRef.current = handlerRef.current;
    }
    handlerRef.current = handler;

    return () => {
      if (handlerRef.current === handler) {
        handlerRef.current = prevHandlerRef.current;
      }
    };
  }, []);

  return {
    fullPage,
    popup,
    confirmWindow,
    onBack,
    registerBackHandler,
  };
});

export const OpenInFullPage: FC = () => {
  const appEnv = useAppEnv();

  useLayoutEffect(() => {
    openInFullPage();
    if (appEnv.popup) {
      window.close();
    }
  }, [appEnv.popup]);

  return null;
};

export function openInFullPage() {
  const { search, hash } = window.location;
  const url = createUrl("fullpage.html", search, hash);
  browser.tabs.create({
    url: browser.runtime.getURL(url),
  });
}
