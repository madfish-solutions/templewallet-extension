import React, { useEffect, useRef } from 'react';

import type { TagData } from '../engine/types';

import { HoverPlaceholder } from './HoverPlaceholder';
import { useHoverCard } from './use-hover-card';

interface LinkHoverProps {
  linkEl: HTMLElement;
  tagData: TagData;
}

export const LinkHover = ({ linkEl, tagData }: LinkHoverProps) => {
  const anchorRef = useRef<HTMLElement | null>(linkEl);
  const { open, handleEnter, handleLeave, cancelClose, close } = useHoverCard();

  useEffect(() => {
    linkEl.addEventListener('mouseenter', handleEnter);
    linkEl.addEventListener('mouseleave', handleLeave);
    return () => {
      linkEl.removeEventListener('mouseenter', handleEnter);
      linkEl.removeEventListener('mouseleave', handleLeave);
    };
  }, [linkEl, handleEnter, handleLeave]);

  return (
    <HoverPlaceholder
      tagData={tagData}
      anchorRef={anchorRef}
      open={open}
      onMouseEnter={cancelClose}
      onMouseLeave={handleLeave}
      onClose={close}
    />
  );
};
