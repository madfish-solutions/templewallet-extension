import * as React from 'react';

import { AnalyticsEventCategory, setTestID, TestIDProps, useAnalytics } from 'lib/analytics';

type AnchorProps = React.PropsWithRef<
  React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>
> &
  TestIDProps & {
    treatAsButton?: boolean;
  };

export const Anchor = React.forwardRef<HTMLAnchorElement, AnchorProps>(
  ({ testID, testIDProperties, treatAsButton, onClick, ...props }, ref) => {
    const { trackEvent } = useAnalytics();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      testID &&
        trackEvent(
          testID,
          treatAsButton ? AnalyticsEventCategory.ButtonPress : AnalyticsEventCategory.LinkPress,
          testIDProperties
        );

      return onClick?.(e);
    };

    return (
      <a ref={ref} onClick={handleClick} {...props} {...setTestID(testID)}>
        {props.children}
      </a>
    );
  }
);
