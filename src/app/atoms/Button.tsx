import type { FC, Ref, ButtonHTMLAttributes, DetailedHTMLProps, MouseEvent } from 'react';

import { AnalyticsEventCategory, setTestID, TestIDProps, useAnalytics } from 'lib/analytics';

export type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & TestIDProps;

type ButtonComponentProps = ButtonProps & {
  ref?: Ref<HTMLButtonElement>;
};

export const Button: FC<ButtonComponentProps> = ({
  testID,
  testIDProperties,
  onClick,
  type = 'button',
  ref,
  ...props
}) => {
  const { trackEvent } = useAnalytics();

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    testID && trackEvent(testID, AnalyticsEventCategory.ButtonPress, testIDProperties);

    return onClick?.(e);
  };

  return <button ref={ref} type={type} onClick={handleClick} {...props} {...setTestID(testID)} />;
};
