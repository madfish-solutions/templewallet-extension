import * as React from 'react';

import { AnalyticsEventCategory, setTestID, TestIDProps, useAnalytics } from 'lib/analytics';

export type ButtonProps = React.PropsWithRef<
  React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
> &
  TestIDProps;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ testID, testIDProperties, onClick, type = 'button', ...props }, ref) => {
    const { trackEvent } = useAnalytics();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      testID && trackEvent(testID, AnalyticsEventCategory.ButtonPress, testIDProperties);

      return onClick?.(e);
    };

    return <button ref={ref} type={type} onClick={handleClick} {...props} {...setTestID(testID)} />;
  }
);
