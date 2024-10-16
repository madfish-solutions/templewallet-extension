import * as React from 'react';

import { AnalyticsEventCategory, setTestID, TestIDProps, useAnalytics } from 'lib/analytics';

export interface AnchorProps
  extends React.PropsWithRef<React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>>,
    TestIDProps {
  treatAsButton?: boolean;
}

export const Anchor = React.forwardRef<HTMLAnchorElement, AnchorProps>(
  (
    { target = '_blank', rel = 'noopener noreferrer', testID, testIDProperties, treatAsButton, onClick, ...props },
    ref
  ) => {
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
      <a target={target} ref={ref} onClick={handleClick} {...props} {...setTestID(testID)}>
        {props.children}
      </a>
    );
  }
);
