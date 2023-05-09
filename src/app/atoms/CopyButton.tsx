import React, { FC, HTMLAttributes, useMemo } from 'react';

import classNames from 'clsx';

import { AnalyticsEventCategory, setTestID, TestIDProps, useAnalytics } from 'lib/analytics';
import { t } from 'lib/i18n';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import useTippy from 'lib/ui/useTippy';

const TEXT_SHADES = {
  500: 'text-gray-500',
  600: 'text-gray-600',
  700: 'text-gray-700'
};

const BG_SHADES = {
  100: 'bg-gray-100 hover:bg-gray-200',
  200: 'bg-gray-200 hover:bg-gray-300'
};

export type CopyButtonProps = HTMLAttributes<HTMLButtonElement> &
  TestIDProps & {
    bgShade?: 100 | 200;
    rounded?: 'sm' | 'base';
    text: string;
    small?: boolean;
    type?: 'button' | 'link';
    textShade?: 500 | 600 | 700;
  };

const CopyButton: FC<CopyButtonProps> = ({
  bgShade = 100,
  children,
  text,
  small = false,
  className,
  type = 'button',
  rounded = 'sm',
  textShade = 600,
  testID,
  testIDProperties,
  ...rest
}) => {
  const { trackEvent } = useAnalytics();
  const { fieldRef, copy, copied, setCopied } = useCopyToClipboard();

  const tippyProps = useMemo(
    () => ({
      trigger: 'mouseenter',
      hideOnClick: false,
      content: copied ? t('copiedHash') : t('copyHashToClipboard'),
      animation: 'shift-away-subtle',
      onHidden() {
        setCopied(false);
      }
    }),
    [copied, setCopied]
  );

  const buttonRef = useTippy<HTMLButtonElement>(tippyProps);

  const handleCopyPress = () => {
    testID && trackEvent(testID, AnalyticsEventCategory.ButtonPress, testIDProperties);

    return copy();
  };

  const classNameMemo = useMemo(
    () =>
      type === 'button'
        ? classNames(
            'font-tnum leading-none select-none',
            'transition ease-in-out duration-300',
            rounded === 'base' ? 'rounded' : 'rounded-sm',
            small ? 'text-xs p-1' : 'text-sm py-1 px-2',
            BG_SHADES[bgShade],
            TEXT_SHADES[textShade],
            className
          )
        : classNames('hover:underline', className),
    [type, className, rounded, small, bgShade, textShade]
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={classNameMemo}
        {...rest}
        onClick={handleCopyPress}
        {...setTestID(testID)}
      >
        {children}
      </button>

      <input ref={fieldRef} value={text} readOnly className="sr-only" />
    </>
  );
};

export default CopyButton;
