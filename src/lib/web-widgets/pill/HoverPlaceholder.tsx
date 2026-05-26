import React, { memo, useEffect, useLayoutEffect, useRef } from 'react';

import { createPortal } from 'react-dom';

import { PILL_STYLES } from './pill-styles';

interface HoverPlaceholderProps {
  anchorRef: React.RefObject<HTMLSpanElement | null>;
  open: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

interface CardHost {
  host: HTMLDivElement;
  mount: HTMLDivElement;
}

const createCardHost = (): CardHost => {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.zIndex = '2147483647';
  host.style.pointerEvents = 'none';

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = PILL_STYLES;
  const mount = document.createElement('div');
  shadow.append(style, mount);

  return { host, mount };
};

export const HoverPlaceholder = memo<HoverPlaceholderProps>(({ anchorRef, open, onMouseEnter, onMouseLeave }) => {
  const hostRef = useRef<CardHost | null>(null);
  if (hostRef.current === null) hostRef.current = createCardHost();
  const { host, mount } = hostRef.current;

  useEffect(() => {
    document.body.appendChild(host);
    return () => host.remove();
  }, [host]);

  // Position the fixed host at the pill before paint whenever it opens.
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!open || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    host.style.top = `${rect.bottom + 4}px`;
    host.style.left = `${rect.left}px`;
  }, [open, anchorRef, host]);

  return createPortal(
    <div
      className={open ? 'tw-hover-placeholder tw-hover-placeholder--visible' : 'tw-hover-placeholder'}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />,
    mount
  );
});
