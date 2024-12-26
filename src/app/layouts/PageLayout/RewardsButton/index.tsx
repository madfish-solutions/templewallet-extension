import React, { memo, useCallback, useState } from 'react';

import { TestIDProps } from 'lib/analytics';
import { T } from 'lib/i18n';
import { Link } from 'lib/woozie';

import { FirefoxStarAnimation } from './firefox-star-animation';
import { StarAnimation } from './star-animation';

export const RewardsButton = memo<TestIDProps>(props => {
  const [isHovered, setIsHovered] = useState(false);

  const handleHover = useCallback(() => setIsHovered(true), []);
  const handleUnhover = useCallback(() => setIsHovered(false), []);

  return (
    <Link
      to="/rewards"
      className="bg-blue-150 text-blue-650 rounded-lg px-2 py-1 text-sm font-semibold leading-tight capitalize"
      onMouseEnter={handleHover}
      onMouseLeave={handleUnhover}
      {...props}
    >
      <div className="flex items-center gap-1 relative">
        {process.env.TARGET_BROWSER === 'firefox' ? (
          <FirefoxStarAnimation loop={isHovered} />
        ) : (
          <StarAnimation loop={isHovered} />
        )}
        <T id="rewards" />
      </div>
    </Link>
  );
});
