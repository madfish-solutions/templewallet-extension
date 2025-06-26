import React, { ReactNode, memo, useCallback } from 'react';

import { useRichFormatTooltip } from 'app/hooks/use-rich-format-tooltip';
import { ReactComponent as InfoFillIcon } from 'app/icons/base/InfoFill.svg';

import { IconBase, IconBaseProps } from './IconBase';

interface TooltipProps extends Partial<IconBaseProps> {
  content: ReactNode;
  wrapperClassName?: string;
}

const basicTooltipProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  interactive: true,
  placement: 'bottom-end' as const,
  animation: 'shift-away-subtle'
};

export const Tooltip = memo<TooltipProps>(
  ({ Icon = InfoFillIcon, content, wrapperClassName = 'max-w-52', ...restProps }) => {
    const tooltipWrapperFactory = useCallback(() => {
      const element = document.createElement('div');
      element.className = wrapperClassName;

      return element;
    }, [wrapperClassName]);
    const infoIconWrapperRef = useRichFormatTooltip<HTMLDivElement>(basicTooltipProps, tooltipWrapperFactory, content);

    return (
      <div ref={infoIconWrapperRef}>
        <IconBase {...restProps} Icon={Icon} />
      </div>
    );
  }
);
