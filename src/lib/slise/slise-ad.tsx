import React, { memo } from 'react';

import { SliseAd as OriginalSliseAd, SliseAdProps } from '@slise/embed-react';

import { useDidMount } from 'lib/ui/hooks/useDidMount';

interface CunningSliseAdProps extends Omit<SliseAdProps, 'format' | 'style'> {
  width: number;
  height: number;
}

export const SliseAd = memo(({ width, height, ...restProps }: CunningSliseAdProps) => {
  useDidMount(() => require('./slise-ad.embed'));

  return (
    <OriginalSliseAd
      {...restProps}
      format={`${width}x${height}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
});
