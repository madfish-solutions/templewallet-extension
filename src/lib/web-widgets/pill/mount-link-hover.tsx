import React from 'react';

import { createRoot } from 'react-dom/client';

import type { TagData } from '../engine/types';

import { LinkHover } from './LinkHover';
import type { MountedPill } from './mount-pill';

export const mountLinkHover = (linkEl: HTMLElement, tagData: TagData): MountedPill => {
  const host = document.createElement('div');
  const root = createRoot(host);
  root.render(<LinkHover linkEl={linkEl} tagData={tagData} />);
  return { root, host };
};
