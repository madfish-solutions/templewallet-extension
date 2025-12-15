import React, { memo, useMemo } from 'react';

import { Button } from 'app/atoms';
import { Lottie } from 'lib/ui/react-lottie';

import { makeAnimationOptions } from './utils';

interface BannerBaseProps {
  animationData: any;
  title: ReactChildren;
  description: ReactChildren;
  onClick?: EmptyFn;
  testID?: string;
}

export const BannerBase = memo<BannerBaseProps>(({ animationData, title, description, onClick, testID }) => {
  const animationOptions = useMemo(() => makeAnimationOptions(animationData), [animationData]);

  return (
    <Button
      className="flex mx-4 mb-3 gap-x-2 p-4 rounded-8 border-0.5 border-lines cursor-pointer bg-white hover:bg-grey-4"
      onClick={onClick}
      testID={testID}
    >
      <div className="flex shrink-0 justify-center items-center w-10 h-10">
        <Lottie isClickToPauseDisabled options={animationOptions} height={40} width={40} />
      </div>

      <div className="flex flex-col gap-y-1 text-left">
        <p className="text-font-medium-bold">{title}</p>
        <p className="text-font-description text-grey-1">{description}</p>
      </div>
    </Button>
  );
});
