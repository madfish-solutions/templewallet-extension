import React, { useRef } from 'react';

import type { TagData } from '../engine/types';

import { HoverPlaceholder } from './HoverPlaceholder';
import { useHoverCard } from './use-hover-card';

const MAX_LABEL_CHARS = 25;

interface PillProps {
  tagData: TagData;
}

export const Pill = ({ tagData }: PillProps) => {
  const label = tagData.label.length > MAX_LABEL_CHARS ? `${tagData.label.slice(0, MAX_LABEL_CHARS)}…` : tagData.label;
  const pillRef = useRef<HTMLSpanElement>(null);
  const { open, handleEnter, handleLeave, cancelClose, close } = useHoverCard();

  return (
    <span ref={pillRef} className="tw-pill" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {tagData.iconUrl ? <img className="tw-pill__icon" src={tagData.iconUrl} alt="nft" /> : null}
      <span className="tw-pill__label">{label}</span>
      <HoverPlaceholder
        tagData={tagData}
        anchorRef={pillRef}
        open={open}
        onMouseEnter={cancelClose}
        onMouseLeave={handleLeave}
        onClose={close}
      />
    </span>
  );
};
