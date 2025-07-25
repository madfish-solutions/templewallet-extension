import React, { memo, useCallback, useState } from 'react';

import { TestIDProps } from 'lib/analytics';
import { IS_FIREFOX } from 'lib/env';
import { T } from 'lib/i18n';
import { Link } from 'lib/woozie';

import { FirefoxStarAnimation } from './firefox-star-animation';
import { StarAnimation } from './star-animation';

// @ts-prune-ignore-next // TODO: Apply in new design // TestID was 'Page Layout/Rewards Button'
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
        {IS_FIREFOX ? <FirefoxStarAnimation loop={isHovered} /> : <StarAnimation loop={isHovered} />}
        <T id="rewards" />
      </div>
    </Link>
  );
});
