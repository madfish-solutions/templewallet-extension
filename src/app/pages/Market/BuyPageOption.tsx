import React, { FC } from 'react';

import { Divider } from 'app/atoms';
import { TestIDProps } from 'lib/analytics';
import { Link } from 'lib/woozie';

interface BuyPageOptionProps extends TestIDProps {
  Icon: ImportedSVGComponent;
  title: string;
  to: string;
}

export const BuyPageOption: FC<BuyPageOptionProps> = ({ Icon, title, to, ...testIDProps }) => (
  <Link
    {...testIDProps}
    className="bg-white p-4 flex flex-col items-center gap-3 w-full max-w-sm border-2 border-gray-300 rounded-10"
    to={to}
  >
    <Icon />

    <Divider thinest />

    <span className="font-semibold text-gray-700 text-base leading-tight">{title}</span>
  </Link>
);
