import './main.css';

import React from 'react';

import { Banner } from '@hypelab/sdk-react';
import { createRoot } from 'react-dom/client';

import { LoadHypelabScript } from 'app/load-hypelab-script';
import { EnvVars } from 'lib/env';

const container = document.getElementById('root');
const root = createRoot(container!);
const searchParams = new URLSearchParams(window.location.hash.replace('#', ''));
const placementSlug = searchParams.get('p') || EnvVars.HYPELAB_SMALL_PLACEMENT_SLUG;

root.render(
  <div>
    <LoadHypelabScript />
    <Banner placement={placementSlug} />
  </div>
);
