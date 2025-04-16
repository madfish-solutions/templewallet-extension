import React, { FC } from 'react';

import clsx from 'clsx';

import { Loader } from 'app/atoms';

interface Props {
  large?: boolean;
  className?: string;
}

export const CollectibleImageLoader: FC<Props> = ({ large = false, className }) => (
  <div className={clsx('w-full aspect-square flex items-center justify-center', className)}>
    <Loader size={large ? 'XXL' : 'L'} trackVariant="dark" className="text-secondary" />
  </div>
);
