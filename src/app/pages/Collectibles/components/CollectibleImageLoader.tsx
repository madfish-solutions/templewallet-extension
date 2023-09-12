import React, { FC } from 'react';

import Spinner from 'app/atoms/Spinner/Spinner';

interface Props {
  large?: boolean;
}

export const CollectibleImageLoader: FC<Props> = ({ large = false }) => (
  <div className="w-full h-full flex items-center justify-center">
    <Spinner theme="dark-gray" className={large ? 'w-10' : 'w-8'} />
  </div>
);
