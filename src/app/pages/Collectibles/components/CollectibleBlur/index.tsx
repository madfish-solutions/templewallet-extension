import React, { FC } from 'react';

import clsx from 'clsx';

import { ReactComponent as RevealEyeSvg } from 'app/icons/reveal-eye.svg';

import BlurImageSrc from './blur.png';

interface Props {
  onClick?: EmptyFn;
}

export const CollectibleBlur: FC<Props> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className={clsx('relative flex justify-center items-center h-full w-full', onClick && 'cursor-pointer')}
    >
      <img src={BlurImageSrc} alt="Adult content" className="h-full w-full text-gray-600" />
      <RevealEyeSvg className="absolute z-10 w-8 h-8 stroke-current fill-current" />
    </div>
  );
};
