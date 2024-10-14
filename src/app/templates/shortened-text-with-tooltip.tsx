import React, { HTMLAttributes, memo, useEffect, useMemo, useRef, useState } from 'react';

import clsx from 'clsx';

import { useRichFormatTooltip } from 'app/hooks/use-rich-format-tooltip';
import { UseTippyOptions } from 'lib/ui/useTippy';
import { combineRefs } from 'lib/ui/utils';

interface ShortenedTextWithTooltipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  children: string;
}

const tooltipWrapperFactory = () => {
  const element = document.createElement('div');
  element.className = 'max-w-88 break-words';

  return element;
};

export const ShortenedTextWithTooltip = memo<ShortenedTextWithTooltipProps>(({ className, children, ...restProps }) => {
  const [isTextOverflow, setIsTextOverflow] = useState(false);

  const basicTippyOptions = useMemo<Omit<UseTippyOptions, 'content'>>(
    () => ({
      trigger: isTextOverflow ? 'mouseenter' : 'manual',
      hideOnClick: false,
      animation: 'shift-away-subtle'
    }),
    [isTextOverflow]
  );
  const tippyRef = useRichFormatTooltip<HTMLSpanElement>(basicTippyOptions, tooltipWrapperFactory, children);
  const localRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = localRef.current;
    setIsTextOverflow(root ? root.scrollWidth > root.clientWidth : false);
  }, [localRef, children]);

  return (
    <span ref={combineRefs(tippyRef, localRef)} className={clsx('truncate', className)} {...restProps}>
      {children}
    </span>
  );
});
