import { FC, AnchorHTMLAttributes, DetailedHTMLProps, MouseEvent } from 'react';

import { AnalyticsEventCategory, setTestID, TestIDProps, useAnalytics } from 'lib/analytics';

export interface AnchorProps
  extends DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>,
    TestIDProps {
  treatAsButton?: boolean;
}

export const Anchor: FC<AnchorProps> = ({
  target = '_blank',
  rel = 'noopener noreferrer',
  testID,
  testIDProperties,
  treatAsButton,
  onClick,
  ref,
  ...props
}) => {
  const { trackEvent } = useAnalytics();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    testID &&
      trackEvent(
        testID,
        treatAsButton ? AnalyticsEventCategory.ButtonPress : AnalyticsEventCategory.LinkPress,
        testIDProperties
      );

    return onClick?.(e);
  };

  return (
    <a target={target} rel={rel} ref={ref} onClick={handleClick} {...props} {...setTestID(testID)}>
      {props.children}
    </a>
  );
};
