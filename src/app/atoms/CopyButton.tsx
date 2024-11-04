import React, { FC, HTMLAttributes, MouseEventHandler, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { toastSuccess } from 'app/toaster';
import { AnalyticsEventCategory, TestIDProps, setTestID, useAnalytics } from 'lib/analytics';
import { t } from 'lib/i18n';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import useTippy from 'lib/ui/useTippy';

export interface CopyButtonProps extends HTMLAttributes<HTMLButtonElement>, TestIDProps {
  text: string;
  isSecret?: boolean;
  shouldShowTooltip?: boolean;
}

export const CopyButton: FC<CopyButtonProps> = ({
  text,
  testID,
  testIDProperties,
  shouldShowTooltip,
  children,
  isSecret,
  className,
  onClick,
  ...rest
}) => {
  const { trackEvent } = useAnalytics();
  const { fieldRef, copy } = useCopyToClipboard();

  const tippyProps = useMemo(
    () => ({
      trigger: 'mouseenter',
      hideOnClick: true,
      content: t('copyHashToClipboard'),
      animation: 'shift-away-subtle',
      placement: 'bottom-end' as const
    }),
    []
  );

  const buttonRef = useTippy<HTMLButtonElement>(tippyProps);

  const handleCopyPress = useCallback<MouseEventHandler<HTMLButtonElement>>(
    e => {
      testID && trackEvent(testID, AnalyticsEventCategory.ButtonPress, testIDProperties);

      copy();
      toastSuccess(t('copiedHash'));
      onClick?.(e);
    },
    [copy, testID, testIDProperties, trackEvent]
  );

  return (
    <>
      <button
        ref={shouldShowTooltip ? buttonRef : undefined}
        type="button"
        className={clsx('w-fit', className)}
        onClick={handleCopyPress}
        {...rest}
        {...setTestID(testID)}
      >
        {children}
      </button>

      <input type={isSecret ? 'password' : 'text'} ref={fieldRef} value={text} readOnly className="sr-only" />
    </>
  );
};
