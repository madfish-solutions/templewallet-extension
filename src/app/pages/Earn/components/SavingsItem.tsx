import React, { memo } from 'react';

import { Link } from 'lib/woozie';

interface SavingsItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  displayYield: string;
  to: string;
}

export const SavingsItem = memo<SavingsItemProps>(({ icon, title, description, to, displayYield }) => (
  <Link
    to={to}
    className="flex items-center justify-between p-3 rounded-8 bg-white hover:bg-grey-4 transition-colors duration-200 border-0.5 border-lines"
  >
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex flex-col">
        <span className="text-font-description-bold text-secondary">{title}</span>
        <span className="text-font-small text-grey-1">{description}</span>
      </div>
    </div>
    <span className="text-font-small-bold text-success">{displayYield}</span>
  </Link>
));
