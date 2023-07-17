import './main.css';

import React from 'react';

import { createRoot } from 'react-dom/client';

import { App } from 'app/App';
import { WindowType, isPopupWindow, openInFullPage } from 'app/env';
import { isPopupModeEnabled } from 'lib/popup-mode';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App env={{ windowType: WindowType.Popup }} />);

if (!isPopupWindow() || !isPopupModeEnabled()) {
  openInFullPage();
  window.close();
}
