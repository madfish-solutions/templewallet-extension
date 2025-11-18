import { useEffect, useRef } from 'react';

import { noop } from 'lodash';
import browser from 'webextension-polyfill';

import { getOutOfTabWindowPortName } from 'lib/utils/out-of-tab-window';

import { useAppEnv } from './env';
import { useThisWindowLocation } from './hooks/use-this-window-location';

export const RegisterOpenedWindow = () => {
  const { popup, sidebar } = useAppEnv();
  const { data: thisWindowLocation } = useThisWindowLocation();
  const outOfTabPortRef = useRef<browser.Runtime.Port | undefined>();

  useEffect(() => {
    if (!thisWindowLocation) return;

    const { windowId: thisWindowId } = thisWindowLocation;

    if ((sidebar || popup) && thisWindowId !== null && !outOfTabPortRef.current) {
      const port = browser.runtime.connect({
        name: getOutOfTabWindowPortName(thisWindowId, sidebar ? 'sidebar' : 'popup')
      });
      port.onDisconnect.addListener(() => void (outOfTabPortRef.current = undefined));
      outOfTabPortRef.current = port;
      const pingInterval = setInterval(() => port.postMessage('ping'), 1000);

      return () => {
        port.disconnect();
        clearInterval(pingInterval);
        outOfTabPortRef.current = undefined;
      };
    }

    return noop;
  }, [popup, sidebar, thisWindowLocation]);

  return null;
};
