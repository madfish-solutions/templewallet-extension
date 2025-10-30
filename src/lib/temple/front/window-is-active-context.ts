import { useEffect, useState } from 'react';

import constate from 'constate';

import { useAppEnv } from 'app/env';
import { useThisWindowLocation } from 'app/hooks/use-this-window-location';

import { useTempleClient } from './client';

export const [WindowIsActiveProvider, useWindowIsActive] = constate(() => {
  const { fullPage, popup, sidebar } = useAppEnv();
  const { data: thisWindowLocation } = useThisWindowLocation();
  const { focusLocation, windowsWithPopups } = useTempleClient();
  const [visibilityState, setVisibilityState] = useState<DocumentVisibilityState>(() => document.visibilityState);

  useEffect(() => {
    if (!thisWindowLocation) return;

    const visibilityListener = () => setVisibilityState(document.visibilityState);
    document.addEventListener('visibilitychange', visibilityListener);

    return () => document.removeEventListener('visibilitychange', visibilityListener);
  }, [popup, sidebar, thisWindowLocation]);

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
    (fullPage
      ? !windowsWithPopups.includes(thisWindowId) && tabId === focusLocation.tabId
      : thisWindowId === focusLocation.windowId)
  );
});
