import React, { memo, useMemo } from 'react';

import clsx from 'clsx';

import { ReactComponent as CleanIcon } from 'app/icons/base/x_circle_fill.svg';
import { T, t } from 'lib/i18n';
import useTippy from 'lib/ui/useTippy';

import { IconBase, Size } from './IconBase';

interface Props {
  className?: string;
  size?: Size;
  showText?: boolean;
  onClick: EmptyFn;
}

export const CLEAN_BUTTON_ID = 'CLEAN_BUTTON_ID';

const CleanButton = memo<Props>(({ className, size = 12, showText, onClick }) => {
  const tippyProps = useMemo(
    () => ({
      trigger: 'mouseenter',
      hideOnClick: false,
      content: t('clean'),
      animation: 'shift-away-subtle',
      placement: 'bottom' as const
    }),
    []
  );

  const buttonRef = useTippy<HTMLButtonElement>(tippyProps);

  return (
    <button
      id={CLEAN_BUTTON_ID}
      ref={showText ? undefined : buttonRef}
      type="button"
      className={clsx(className, 'flex items-center ease-in-out duration-200', showText && 'px-1 py-0.5')}
      tabIndex={-1}
      onClick={onClick}
    >
      {showText && (
        <span className="text-font-description-bold text-grey-1">
          <T id="clear" />
        </span>
      )}
      <IconBase Icon={CleanIcon} size={size} className="text-grey-2" />
    </button>
  );
});

export default CleanButton;
