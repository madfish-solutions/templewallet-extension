import React, { FC, HTMLAttributes, ReactNode, useEffect, useRef } from 'react';

import classNames from 'clsx';

import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { t } from 'lib/i18n';

import { AlertSelectors } from './Alert.selectors';

type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  type?: 'success' | 'warning' | 'error' | 'delegate';
  title?: ReactNode;
  description: ReactNode;
  autoFocus?: boolean;
  closable?: boolean;
  onClose?: () => void;
};

export const Alert: FC<AlertProps> = ({
  type = 'warning',
  title,
  description,
  autoFocus,
  className,
  closable,
  onClose,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus) {
      ref.current?.focus();
    }
  }, [autoFocus]);

  const [bgColorClassName, borderColorClassName, textColorClassName, titleColorClassName] = (() => {
    switch (type) {
      case 'success':
        return ['bg-green-100', 'border-green-400', 'text-green-700', 'text-green-700'];
      case 'warning':
        return ['bg-yellow-100', 'border-yellow-400', 'text-yellow-700', 'text-yellow-700'];
      case 'error':
        return ['bg-red-100', 'border-red-400', 'text-red-700', 'text-red-700'];
      case 'delegate':
        return ['bg-blue-150', 'border-blue-500', 'text-blue-750', 'text-blue-500'];
    }
  })();

  return (
    <div
      ref={ref}
      className={classNames(
        'relative w-full px-4 pt-3',
        bgColorClassName,
        'border',
        borderColorClassName,
        'rounded-md',
        className
      )}
      tabIndex={-1}
      role="alert"
      aria-label={t('alert')}
      {...rest}
    >
      {title && (
        <h2
          className={classNames('mb-1 text-lg font-semibold', titleColorClassName)}
          {...setTestID(AlertSelectors.alertTitle)}
          {...setAnotherSelector('type', type)}
        >
          {title}
        </h2>
      )}
      {description && (
        <div className={classNames('pb-3 text-sm max-h-32 font-light break-words overflow-y-auto', textColorClassName)}>
          {description}
        </div>
      )}
      {closable && (
        <button className="absolute top-3 right-3" onClick={onClose} type="button">
          <CloseIcon className="w-auto h-5 stroke-current" style={{ strokeWidth: 2 }} />
        </button>
      )}
    </div>
  );
};
