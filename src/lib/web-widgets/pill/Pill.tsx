import React, { memo, useCallback, useRef, useState } from 'react';

import { HoverPlaceholder } from './HoverPlaceholder';

import type { TagData } from '../engine/types';

const OPEN_DELAY_MS = 150;
const CLOSE_DELAY_MS = 10;
const MAX_LABEL_CHARS = 25;

interface PillProps {
  tagData: TagData;
}

export const Pill = memo<PillProps>(({ tagData }) => {
  const label =
    tagData.label.length > MAX_LABEL_CHARS ? `${tagData.label.slice(0, MAX_LABEL_CHARS)}…` : tagData.label;
  const [open, setOpen] = useState(false);
  const pillRef = useRef<HTMLSpanElement>(null);
  const openTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cancelOpen = useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const handleEnter = useCallback(() => {
    cancelClose();
    openTimerRef.current = setTimeout(() => {
      setOpen(true);
      openTimerRef.current = null;
    }, OPEN_DELAY_MS);
  }, [cancelClose]);

  const handleLeave = useCallback(() => {
    cancelOpen();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  }, [cancelOpen]);

  return (
    <span ref={pillRef} className="tw-pill" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {tagData.iconUrl ? <img className="tw-pill__icon" src={tagData.iconUrl} alt="nft" /> : null}
      <span className="tw-pill__label">{label}</span>
      <HoverPlaceholder anchorRef={pillRef} open={open} onMouseEnter={cancelClose} onMouseLeave={handleLeave} />
    </span>
  );
});
