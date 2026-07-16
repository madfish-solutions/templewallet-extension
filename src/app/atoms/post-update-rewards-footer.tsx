import { FC } from 'react';

interface PostUpdateRewardsFooterProps {
  daysRemaining: number;
  className?: string;
}

export const PostUpdateRewardsFooter: FC<PostUpdateRewardsFooterProps> = ({ daysRemaining, className }) => (
  <div className={`bg-warning-low p-2 flex gap-1 justify-center text-font-num-10 ${className ?? ''}`}>
    <strong className="font-medium text-text">You earn 2x:</strong>
    <span className="text-grey-1">
      {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
    </span>
  </div>
);
