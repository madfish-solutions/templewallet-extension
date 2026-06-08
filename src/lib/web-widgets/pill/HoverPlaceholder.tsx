import React, { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';

import clsx from 'clsx';
import { createPortal } from 'react-dom';

import type { TagData } from '../engine/types';

import { NftCard } from './card/NftCard';
import { PILL_STYLES } from './pill-styles';

interface HoverPlaceholderProps {
  tagData: TagData;
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onMouseEnter: EmptyFn;
  onMouseLeave: EmptyFn;
  onClose: EmptyFn;
}

interface CardHost {
  host: HTMLDivElement;
  mount: HTMLDivElement;
}

const VIEWPORT_GAP = 4;
// Match the card's fixed CSS dimensions, used for the first layout pass before the child
const FALLBACK_CARD_HEIGHT = 392;
const FALLBACK_CARD_WIDTH = 452;

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

// Wrapped in memo so the React Compiler doesn't flag the lazy useRef init during render.
export const HoverPlaceholder = memo<HoverPlaceholderProps>(
  ({ tagData, anchorRef, open, onMouseEnter, onMouseLeave, onClose }) => {
    const hostRef = useRef<CardHost | null>(null);
    if (hostRef.current === null) hostRef.current = createCardHost();
    const { host, mount } = hostRef.current;

    const [flipped, setFlipped] = useState(false);

    useEffect(() => {
      document.body.appendChild(host);
      return () => host.remove();
    }, [host]);

    // Position the fixed host at the pill before paint: prefer below, flip above when it would
    // overflow the viewport bottom, then clamp inside the viewport.
    useLayoutEffect(() => {
      const anchor = anchorRef.current;
      if (!open || !anchor) return;

      const rect = anchor.getBoundingClientRect();
      const card = mount.firstElementChild;
      const cardHeight = card instanceof HTMLElement ? card.offsetHeight : FALLBACK_CARD_HEIGHT;
      const cardWidth = card instanceof HTMLElement ? card.offsetWidth : FALLBACK_CARD_WIDTH;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = rect.bottom + VIEWPORT_GAP;
      let didFlip = false;
      if (top + cardHeight + VIEWPORT_GAP > viewportHeight && rect.top - cardHeight - VIEWPORT_GAP >= 0) {
        top = rect.top - cardHeight - VIEWPORT_GAP;
        didFlip = true;
      }
      top = Math.max(VIEWPORT_GAP, Math.min(top, viewportHeight - cardHeight - VIEWPORT_GAP));
      const left = Math.max(VIEWPORT_GAP, Math.min(rect.left, viewportWidth - cardWidth - VIEWPORT_GAP));

      host.style.top = `${top}px`;
      host.style.left = `${left}px`;
      setFlipped(didFlip);
    }, [open, anchorRef, host, mount]);

    useEffect(() => {
      if (!open) return;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    return createPortal(
      <div
        className={clsx(
          'tw-hover-placeholder',
          open && 'tw-hover-placeholder--visible',
          flipped && 'tw-hover-placeholder--above'
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {open ? <NftCard tagData={tagData} onClose={onClose} /> : null}
      </div>,
      mount
    );
  }
);
