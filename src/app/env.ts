import { FC, useCallback, useLayoutEffect, useRef } from 'react';

import constate from 'constate';
import browser from 'webextension-polyfill';

import { IS_SIDE_PANEL_AVAILABLE } from 'lib/env';
import { createUrl } from 'lib/woozie';

type AppEnvironment = {
  windowType: WindowType;
  confirmWindow?: boolean;
};

export enum WindowType {
  Popup,
  FullPage,
  Sidebar
}

type BackHandler = () => void;

export const [AppEnvProvider, useAppEnv] = constate((env: AppEnvironment) => {
  const fullPage = env.windowType === WindowType.FullPage;
  const popup = env.windowType === WindowType.Popup;
  const sidebar = env.windowType === WindowType.Sidebar;
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
    sidebar,
    confirmWindow,
    onBack,
    registerBackHandler
  };
});

export const OpenInFullPage: FC = () => {
  const { fullPage } = useAppEnv();

  useLayoutEffect(() => {
    openInFullPage();
    if (!fullPage) {
      window.close();
    }
  }, [fullPage]);

  return null;
};

export const isPopupWindow = () => browser.extension.getViews({ type: 'popup' }).includes(window);

export function openInFullPage() {
  const { search, hash } = window.location;
  const url = createUrl('fullpage.html', search, hash);
  browser.tabs.create({
    url: browser.runtime.getURL(url)
  });
}

export function openInFullConfirmPage() {
  const { search, hash } = window.location;
  const searchParams = new URLSearchParams(search);
  searchParams.set('full', '1');
  const searchString = searchParams.toString();
  const url = createUrl('confirm.html', searchString ? `?${searchString}` : '', hash);
  browser.tabs.create({
    url: browser.runtime.getURL(url)
  });
}

export function openInSidebar() {
  if (IS_SIDE_PANEL_AVAILABLE) {
    return browser.windows
      .getCurrent()
      .then(currentWindow =>
        currentWindow.id === undefined ? Promise.resolve() : chrome.sidePanel.open({ windowId: currentWindow.id })
      );
  }

  throw new Error('Not supported in this browser yet');
}

export function openPopup() {
  return browser.action.openPopup();
}

export function setIsSidebarByDefault(isSidebar: boolean) {
  if (IS_SIDE_PANEL_AVAILABLE) {
    return chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: isSidebar });
  }

  throw new Error('Not supported in this browser yet');
}

export async function getIsSidebarByDefault() {
  if (IS_SIDE_PANEL_AVAILABLE) {
    const { openPanelOnActionClick = false } = await chrome.sidePanel.getPanelBehavior();

    return openPanelOnActionClick;
  }

  return false;
}
