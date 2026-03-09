import './main.css';

import React from 'react';

import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';

import { App } from 'app/App';
import { WindowType } from 'app/env';
import { TempleMessageType, TempleStatus } from 'lib/temple/types';
import { assertResponse, makeIntercomRequest } from 'temple/front/intercom-client';

// Ensure a single fullpage tab exists before the first wallet is created
(async () => {
  try {
    const res = await makeIntercomRequest({ type: TempleMessageType.GetStateRequest });
    assertResponse(res.type === TempleMessageType.GetStateResponse);

    if (res.state.status !== TempleStatus.Idle) return;

    const fullpageBase = browser.runtime.getURL('fullpage.html');
    const views = browser.extension.getViews({ type: 'tab' });

    for (const w of views) {
      if (w === window) continue;
      const href = w.location?.href ?? '';
      if (href.startsWith(fullpageBase)) {
        w.close();
      }
    }
  } catch (e) {
    console.error('Failed to enforce single Welcome tab:', e);
  }
})();

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App env={{ windowType: WindowType.FullPage }} />);
