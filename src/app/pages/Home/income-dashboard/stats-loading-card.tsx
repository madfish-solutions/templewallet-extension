import { FC } from 'react';

import { Loader } from 'app/atoms';
import { Link } from 'lib/woozie';

interface StatsLoadingCardProps {
  linkTo: string;
}

export const StatsLoadingCard: FC<StatsLoadingCardProps> = ({ linkTo }) => (
  <Link className="bg-white rounded-8 border-0.5 border-lines flex justify-center items-center min-h-25" to={linkTo}>
    <Loader size="L" trackVariant="dark" className="text-secondary" />
  </Link>
);
