import { useEffect, useState } from 'react';

import constate from 'constate';
import browser from 'webextension-polyfill';

import { useAppEnv } from 'app/env';
import { useTypedSWR } from 'lib/swr';

import { useTempleClient } from './client';

const getThisWindowLocation = () =>
  Promise.all([browser.windows.getCurrent(), browser.tabs.getCurrent()]).then(([window, tab]) => ({
    windowId: window.id ?? null,
    tabId: tab?.id ?? null
  }));

export const [WindowIsActiveProvider, useWindowIsActive] = constate(() => {
  const { popup } = useAppEnv();
  const { data: thisWindowLocation } = useTypedSWR('window-location', getThisWindowLocation);
  const { focusLocation, windowsWithPopups, setWindowPopupState } = useTempleClient();
  const [visibilityState, setVisibilityState] = useState<DocumentVisibilityState>(() => document.visibilityState);

  useEffect(() => {
    if (!popup || !thisWindowLocation) return;

    const { windowId: thisWindowId } = thisWindowLocation;

    setWindowPopupState(thisWindowId, true);

    // Will not work properly if a cleanup function is returned
    window.document.addEventListener('visibilitychange', () => {
      setVisibilityState(document.visibilityState);
      setWindowPopupState(thisWindowId, window.document.visibilityState === 'visible');
    });
  }, [popup, setWindowPopupState, thisWindowLocation]);

  if (thisWindowLocation === undefined) {
    return true;
  }

  const { windowId: thisWindowId, tabId } = thisWindowLocation;
  const documentIsVisible = visibilityState === 'visible';

  if (!focusLocation) {
    return documentIsVisible;
  }

  return (
    documentIsVisible &&
    (popup
      ? thisWindowId === focusLocation.windowId
      : !windowsWithPopups.includes(thisWindowId) && tabId === focusLocation.tabId)
  );
});
