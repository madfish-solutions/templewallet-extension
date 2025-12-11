import React, { FC, HTMLAttributes, ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';

import clsx from 'clsx';

import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';
import { ReactComponent as ErrorIcon } from 'app/icons/typed-msg/error.svg';
import { ReactComponent as InfoIcon } from 'app/icons/typed-msg/info.svg';
import { ReactComponent as SuccessIcon } from 'app/icons/typed-msg/success.svg';
import { ReactComponent as WarningIcon } from 'app/icons/typed-msg/warning.svg';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { t } from 'lib/i18n';

import { AlertSelectors } from './Alert.selectors';

type AlertType = 'success' | 'warning' | 'error' | 'delegate' | 'info';

type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  type?: AlertType;
  title?: ReactNode;
  description: ReactNode;
  autoFocus?: boolean;
  closable?: boolean;
  onClose?: EmptyFn;
};

const backgroundClassNames: Record<AlertType, string> = {
  success: 'bg-success-low',
  warning: 'bg-warning-low',
  error: 'bg-error-low',
  delegate: 'bg-secondary-low',
  info: 'bg-secondary-low'
};

const icons: Record<AlertType, ImportedSVGComponent | undefined> = {
  success: SuccessIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  delegate: undefined,
  info: InfoIcon
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
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [isMultiLine, setIsMultiLine] = useState(false);
  const Icon = icons[type];

  const descriptionElement = (
    <div
      ref={descriptionRef}
      className="text-font-description flex-1 max-h-32 break-words overflow-y-auto"
      {...setTestID(AlertSelectors.alertDescription)}
    >
      {description}
    </div>
  );

  useLayoutEffect(() => {
    const element = descriptionRef.current;
    if (element) {
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      setIsMultiLine(element.scrollHeight > lineHeight * 1.5);
    }
  }, [description]);

  useEffect(() => {
    if (autoFocus) {
      ref.current?.focus();
    }
  }, [autoFocus]);

  return (
    <div
      ref={ref}
      className={clsx('relative w-full p-3 rounded-md', backgroundClassNames[type], className)}
      tabIndex={-1}
      role="alert"
      aria-label={t('alert')}
      {...rest}
    >
      {title && (
        <h2
          className="mb-1 text-lg font-semibold"
          {...setTestID(AlertSelectors.alertTitle)}
          {...setAnotherSelector('type', type)}
        >
          {title}
        </h2>
      )}
      {description && !Icon && descriptionElement}
      {description && Icon && (
        <div className={clsx('w-full flex gap-x-1', isMultiLine ? 'items-start' : 'items-center')}>
          <Icon className="w-6 h-auto" />
          {descriptionElement}
        </div>
      )}
      {closable && (
        <button className="absolute top-3 right-3" onClick={onClose} type="button">
          <CloseIcon className="w-auto h-5 stroke-current" />
        </button>
      )}
    </div>
  );
};

export const DescriptionWithHeader: FC<PropsWithChildren<{ header: ReactChildren }>> = ({ header, children }) => (
  <div className="flex flex-col gap-0.5 text-font-description">
    <p className="text-font-description-bold">{header}</p>
    {children}
  </div>
);
