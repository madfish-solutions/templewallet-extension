import React, { FC, useLayoutEffect, useState } from 'react';

import CSSTransition from 'react-transition-group/CSSTransition';

import { useUserAnalyticsAndAdsSettings } from '../hooks/use-user-analytics-and-ads-settings.hook';

const BootAnimation: FC<PropsWithChildren> = ({ children }) => {
  const [booted, setBooted] = useState(false);

  useLayoutEffect(() => {
    setBooted(true);
  }, [setBooted]);

  useUserAnalyticsAndAdsSettings();

  return (
    <CSSTransition in={booted} timeout={200}>
      {children}
    </CSSTransition>
  );
};

export default BootAnimation;
