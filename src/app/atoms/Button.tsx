import * as React from "react";

import { AnalyticsEventCategory, TestIDProps, useAnalyticsTrackEvent } from "lib/analytics";

interface Props extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, TestIDProps {
}

export const Button = React.forwardRef<HTMLButtonElement, Props>(({ testID, onClick, ...props }, ref) => {
    const trackEvent = useAnalyticsTrackEvent();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      testID !== undefined && trackEvent(testID, AnalyticsEventCategory.ButtonPress);

      onClick !== undefined && onClick(e);
    }
    return <button ref={ref} onClick={handleClick} {...props} />
  }
);
