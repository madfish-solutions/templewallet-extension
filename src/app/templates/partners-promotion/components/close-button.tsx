import React, { memo, MouseEventHandler } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { ReactComponent as XIcon } from 'app/icons/base/x.svg';
import { t } from 'lib/i18n';

interface CloseButtonProps {
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export const CloseButton = memo<CloseButtonProps>(({ className, onClick }) => (
  <button
    className={clsx(
      'w-5 h-5 flex justify-center items-center z-20 rounded-circle absolute top-2 right-2',
      'bg-grey-4 hover:bg-secondary-hover-low',
      className
    )}
    onClick={onClick}
    title={t('hideAd')}
  >
    <IconBase Icon={XIcon} size={12} className="text-secondary" />
  </button>
));
