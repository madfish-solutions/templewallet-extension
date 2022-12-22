import * as React from 'react';

import { AnalyticsEventCategory, TestIDProps, useAnalytics } from 'lib/analytics';

interface Props
  extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
    TestIDProps {}

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ trackID, trackProperties, onClick, ...props }, ref) => {
    const { trackEvent } = useAnalytics();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      trackID !== undefined && trackEvent(trackID, AnalyticsEventCategory.ButtonPress, trackProperties);

      return onClick !== undefined && onClick(e);
    };

    return <button ref={ref} onClick={handleClick} {...props} />;
  }
);
