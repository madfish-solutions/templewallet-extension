import { useEffect } from 'react';

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import browser from 'webextension-polyfill';

import { EnvVars } from 'lib/env';

export const usePushNotifications = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      initializeApp(JSON.parse(EnvVars.TEMPLE_FIREBASE_CONFIG));
      const messaging = getMessaging();

      Notification.requestPermission().then(async permission => {
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: EnvVars.TEMPLE_FIREBASE_MESSAGING_VAPID_KEY,
            serviceWorkerRegistration: await navigator.serviceWorker.getRegistration(
              browser.runtime.getURL('background/index.js')
            )
          });
          console.log(token);
        }
      });
    }
  }, []);
};
