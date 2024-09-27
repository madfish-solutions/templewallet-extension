import React, { FC, HTMLAttributes, useCallback, useMemo } from 'react';

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

  const handleCopyPress = useCallback(() => {
    testID && trackEvent(testID, AnalyticsEventCategory.ButtonPress, testIDProperties);

    copy();
    toastSuccess(t('copiedHash'));
  }, [copy, testID, testIDProperties, trackEvent]);

  return (
    <>
      <button
        ref={shouldShowTooltip ? buttonRef : undefined}
        type="button"
        {...rest}
        onClick={handleCopyPress}
        {...setTestID(testID)}
      >
        {children}
      </button>

      <input type={isSecret ? 'password' : 'text'} ref={fieldRef} value={text} readOnly className="sr-only" />
    </>
  );
};
