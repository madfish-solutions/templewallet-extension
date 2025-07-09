import './main.css';

import React from 'react';

import { createRoot } from 'react-dom/client';

import { App } from 'app/App';
import { WindowType, openInFullPage } from 'app/env';
import { SHOULD_BACKUP_MNEMONIC_STORAGE_KEY } from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App env={{ windowType: WindowType.Sidebar }} />);

if (await fetchFromStorage(SHOULD_BACKUP_MNEMONIC_STORAGE_KEY)) {
  openInFullPage();
  window.close();
}
