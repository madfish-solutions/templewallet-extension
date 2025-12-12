import './main.css';

import React from 'react';

import { createRoot } from 'react-dom/client';

import { App } from 'app/App';
import { WindowType } from 'app/env';

const params = new URLSearchParams(window.location.search);
const forceFull = params.get('full') === '1';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App env={{ windowType: forceFull ? WindowType.FullPage : WindowType.Popup, confirmWindow: true }} />);
