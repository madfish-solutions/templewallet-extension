import React, { useMemo } from 'react';

import classNames from 'clsx';

import { useAppEnv } from 'app/env';
import { Image } from 'lib/ui/Image';

type DAppIconProps = {
  name: string;
  logo: string;
  className?: string;
};

export const DAppIcon: React.FC<DAppIconProps> = ({ name, logo, className }) => {
  const { popup } = useAppEnv();

  const fallbackElement = useMemo(() => <span className="text-gray-700 text-xs">{name}</span>, [name]);

  return (
    <div
      className={classNames(
        'bg-white border border-gray-300 rounded-2xl flex justify-center items-center p-4',
        !popup && 'w-20 h-20',
        className
      )}
      style={popup ? { width: '4.5rem', height: '4.5rem' } : undefined}
    >
      <Image sources={logo} className="rounded-2xl" alt={name} loader={fallbackElement} fallback={fallbackElement} />
    </div>
  );
};
