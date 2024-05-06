import React, { memo, useMemo } from 'react';

import classNames from 'clsx';

import { ReactComponent as CleanIcon } from 'app/icons/x_circle_fill.svg';
import { t } from 'lib/i18n';
import useTippy from 'lib/ui/useTippy';

import { IconBase } from './IconBase';

interface Props {
  onClick: EmptyFn;
}

export const CLEAN_BUTTON_ID = 'CLEAN_BUTTON_ID';

const CleanButton = memo<Props>(({ onClick }) => {
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
      className={classNames('absolute right-3 bottom-2', 'flex items-center', 'transition ease-in-out duration-200')}
      tabIndex={-1}
      onClick={onClick}
    >
      <IconBase Icon={CleanIcon} size={12} className="text-grey-2" />
    </button>
  );
});

export default CleanButton;
