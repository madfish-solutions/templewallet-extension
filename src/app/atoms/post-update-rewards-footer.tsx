import { FC } from 'react';

import { t, T } from 'lib/i18n';

interface PostUpdateRewardsFooterProps {
  daysRemaining: number;
  className?: string;
}

export const PostUpdateRewardsFooter: FC<PostUpdateRewardsFooterProps> = ({ daysRemaining, className }) => (
  <div className={`bg-warning-low p-2 flex gap-1 justify-center text-font-num-10 ${className ?? ''}`}>
    <strong className="font-medium text-text">
      <T id="postUpdateRewardsFooterTitle" />
    </strong>
    <span className="text-grey-1">
      {t(
        daysRemaining === 1 ? 'postUpdateRewardsFooterDayLeft' : 'postUpdateRewardsFooterDaysLeft',
        String(daysRemaining)
      )}
    </span>
  </div>
);
