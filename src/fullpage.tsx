import './main.css';

import React from 'react';

import { initializeApp } from 'firebase/app';
import { getMessaging, onMessage, getToken } from 'firebase/messaging';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';

import { App } from 'app/App';
import { WindowType } from 'app/env';

import { EnvVars } from './lib/env';

const firebase = initializeApp(JSON.parse(EnvVars.TEMPLE_FIREBASE_CONFIG));
const messaging = getMessaging(firebase);

function requestPermission() {
  console.log('Requesting permission...');
  Notification.requestPermission().then(async permission => {
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      console.log(browser.runtime.getURL('background/index.js'), 'url');

      const token = await getToken(messaging, {
        vapidKey: EnvVars.TEMPLE_FIREBASE_MESSAGING_VAPID_KEY,
        serviceWorkerRegistration: await navigator.serviceWorker.getRegistration(
          browser.runtime.getURL('background/index.js')
        )
      });

      console.log(token, 'token');
    } else {
      console.log('Notification permission not granted.');
    }
  });
}

requestPermission();

onMessage(messaging, payload => {
  console.log('Message received ', payload);
});

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App env={{ windowType: WindowType.FullPage }} />);
