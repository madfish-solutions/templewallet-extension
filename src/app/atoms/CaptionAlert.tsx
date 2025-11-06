import React, { memo } from 'react';

import clsx from 'clsx';

import { ReactComponent as ErrorIcon } from 'app/icons/typed-msg/error.svg';
import { ReactComponent as InfoIcon } from 'app/icons/typed-msg/info.svg';
import { ReactComponent as SuccessIcon } from 'app/icons/typed-msg/success.svg';
import { ReactComponent as WarningIcon } from 'app/icons/typed-msg/warning.svg';

type CaptionAlertType = 'success' | 'error' | 'info' | 'warning';

interface Props {
  type: CaptionAlertType;
  message: string;
  title?: string;
  className?: string;
  textClassName?: string;
  children?: ReactChildren;
}

const TYPE_CLASSES: Record<CaptionAlertType, string> = {
  success: 'bg-success-low',
  error: 'bg-error-low',
  info: 'bg-secondary-low',
  warning: 'bg-warning-low'
};

const ICONS: Record<CaptionAlertType, ImportedSVGComponent> = {
  success: SuccessIcon,
  error: ErrorIcon,
  info: InfoIcon,
  warning: WarningIcon
};

/** Refer to `./Alert` for existing functionality */
export const CaptionAlert = memo<Props>(({ type, message, title, className, textClassName, children }) => {
  const Icon = ICONS[type];

  return (
    <div className={clsx('flex items-start p-3 gap-x-1 rounded-md', TYPE_CLASSES[type], className)}>
      <Icon className="shrink-0 w-6 h-6" />

      <div className="flex-1">
        {title && <p className="text-font-description-bold">{title}</p>}
        <p className={clsx('text-font-description', textClassName)}>{message}</p>
        {children}
      </div>
    </div>
  );
});
