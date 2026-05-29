import React, { useRef, useState } from 'react';

import type { TagData } from '../engine/types';

import { HoverPlaceholder } from './HoverPlaceholder';

const OPEN_DELAY_MS = 150;
const CLOSE_DELAY_MS = 10;
const MAX_LABEL_CHARS = 25;

interface PillProps {
  tagData: TagData;
}

export const Pill = ({ tagData }: PillProps) => {
  const label = tagData.label.length > MAX_LABEL_CHARS ? `${tagData.label.slice(0, MAX_LABEL_CHARS)}…` : tagData.label;
  const [open, setOpen] = useState(false);
  const pillRef = useRef<HTMLSpanElement>(null);
  const openTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cancelOpen = () => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  };

  const cancelClose = () => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleEnter = () => {
    cancelClose();
    openTimerRef.current = setTimeout(() => {
      setOpen(true);
      openTimerRef.current = null;
    }, OPEN_DELAY_MS);
  };

  const handleLeave = () => {
    cancelOpen();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  };

  return (
    <span ref={pillRef} className="tw-pill" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {tagData.iconUrl ? <img className="tw-pill__icon" src={tagData.iconUrl} alt="nft" /> : null}
      <span className="tw-pill__label">{label}</span>
      <HoverPlaceholder anchorRef={pillRef} open={open} onMouseEnter={cancelClose} onMouseLeave={handleLeave} />
    </span>
  );
};
