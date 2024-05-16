import React, { memo, useMemo } from 'react';

import clsx from 'clsx';

import { ReactComponent as CleanIcon } from 'app/icons/base/x_circle_fill.svg';
import { t } from 'lib/i18n';
import useTippy from 'lib/ui/useTippy';

import { IconBase, Size } from './IconBase';

interface Props {
  className?: string;
  size?: Size;
  onClick: EmptyFn;
}

export const CLEAN_BUTTON_ID = 'CLEAN_BUTTON_ID';

const CleanButton = memo<Props>(({ className, size = 12, onClick }) => {
  const tippyProps = useMemo(
    () => ({
      trigger: 'mouseenter',
      hideOnClick: false,
      content: t('clean'),
      animation: 'shift-away-subtle'
    }),
    []
  );

  const buttonRef = useTippy<HTMLButtonElement>(tippyProps);

  return (
    <button
      id={CLEAN_BUTTON_ID}
      ref={buttonRef}
      type="button"
      className={clsx(className, 'flex items-center transition ease-in-out duration-200')}
      tabIndex={-1}
      onClick={onClick}
    >
      <IconBase Icon={CleanIcon} size={size} className="text-grey-2" />
    </button>
  );
});

export default CleanButton;
