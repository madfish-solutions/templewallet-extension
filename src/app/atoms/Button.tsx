import * as React from "react";

import {
  AnalyticsEventCategory,
  TestIDProps,
  useAnalytics,
} from "lib/analytics";

interface Props
  extends React.DetailedHTMLProps<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >,
    TestIDProps {}

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ testID, testIDProperties, onClick, ...props }, ref) => {
    const { trackEvent } = useAnalytics();

    const handleClick = (
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
      testID !== undefined &&
        trackEvent(
          testID,
          AnalyticsEventCategory.ButtonPress,
          testIDProperties
        );

      return onClick !== undefined && onClick(e);
    };
    return <button ref={ref} onClick={handleClick} {...props} />;
  }
);
