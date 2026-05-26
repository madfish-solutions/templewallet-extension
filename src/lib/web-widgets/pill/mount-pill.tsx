import React from 'react';

import { createRoot, type Root } from 'react-dom/client';

import type { DetectedRef, TagData } from '../engine/types';
import { parseStatusId, USER_NAME, TWEET_TEXT } from '../x-dom/selectors';

import { Pill } from './Pill';
import { PILL_STYLES } from './pill-styles';

const HOST_MARKER_ATTR = 'data-tw-web-widget-pill';
const ROW_MARKER_ATTR = 'data-tw-web-widgets-row';

export interface MountedPill {
  root: Root;
  host: HTMLDivElement;
}

// Find the existing pills row inside this post, or create one between User-Name and tweetText
const ensurePillsRow = (post: HTMLElement, userName: Element): HTMLElement => {
  const existing = post.querySelector<HTMLElement>(`[${ROW_MARKER_ATTR}]`);
  if (existing) return existing;

  const row = document.createElement('div');
  row.setAttribute(ROW_MARKER_ATTR, 'true');
  row.style.display = 'flex';
  row.style.flexWrap = 'wrap';
  row.style.gap = '6px';
  row.style.margin = '4px 0';

  userName.parentElement?.insertBefore(row, userName.nextSibling);

  return row;
};

export const mountPill = (ref: DetectedRef, tagData: TagData): MountedPill | null => {
  const post = ref.postEl;

  if (!post.isConnected || !document.contains(post)) return null;

  const userName = post.querySelector(USER_NAME);
  const tweetText = post.querySelector(TWEET_TEXT);
  if (!userName || !tweetText) return null;

  if (ref.statusId && parseStatusId(post) !== ref.statusId) return null;

  const row = ensurePillsRow(post, userName);

  const host = document.createElement('div');
  host.setAttribute(HOST_MARKER_ATTR, 'true');
  host.style.display = 'inline-flex';

  const shadowRoot = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = PILL_STYLES;
  shadowRoot.appendChild(style);

  const mountPoint = document.createElement('span');
  shadowRoot.appendChild(mountPoint);

  row.appendChild(host);

  const root = createRoot(mountPoint);
  root.render(<Pill tagData={tagData} />);

  return { root, host };
};
