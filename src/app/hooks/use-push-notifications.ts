import { useEffect } from 'react';

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import browser from 'webextension-polyfill';

import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { EnvVars } from 'lib/env';
import { useLocalStorage } from 'lib/ui/local-storage';

export const usePushNotifications = () => {
  const [fcmToken, setFcmToken] = useLocalStorage<string | undefined>('fcmToken', undefined);
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      initializeApp(JSON.parse(EnvVars.TEMPLE_FIREBASE_CONFIG));
      const messaging = getMessaging();

      Notification.requestPermission().then(async permission => {
        if (permission === 'granted' && !fcmToken) {
          const token = await getToken(messaging, {
            vapidKey: EnvVars.TEMPLE_FIREBASE_MESSAGING_VAPID_KEY,
            serviceWorkerRegistration: await navigator.serviceWorker.getRegistration(
              browser.runtime.getURL('background/index.js')
            )
          });

          if (token) {
            setFcmToken(token);
          }

          await trackEvent('PUSH_NOTIFICATIONS_ENABLED', AnalyticsEventCategory.General);
        }
      });
    }
  }, [trackEvent]);
};
