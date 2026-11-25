import React, { memo, MouseEventHandler } from 'react';

import clsx from 'clsx';

import { Button, IconBase } from 'app/atoms';
import { ReactComponent as XIcon } from 'app/icons/base/x.svg';
import { TestIDProps } from 'lib/analytics';
import { t } from 'lib/i18n';

interface FloatingCloseButtonProps extends TestIDProps {
  className?: string;
  title?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export const FloatingCloseButton = memo<FloatingCloseButtonProps>(
  ({ className, title = t('close'), onClick, testID, testIDProperties }) => (
    <Button
      className={clsx(
        'w-5 h-5 flex justify-center items-center z-20 rounded-circle absolute top-2 right-2',
        'bg-grey-4 hover:bg-secondary-hover-low',
        className
      )}
      onClick={onClick}
      title={title}
      testID={testID}
      testIDProperties={testIDProperties}
    >
      <IconBase Icon={XIcon} size={12} className="text-secondary" />
    </Button>
  )
);
