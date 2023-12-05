import React, { memo } from 'react';

import { SliseAd as OriginalSliseAd, SliseAdProps } from '@slise/embed-react';

import { useDidMount } from 'lib/ui/hooks/useDidMount';

import { getSlotId } from './get-slot-id';

interface CunningSliseAdProps extends Omit<SliseAdProps, 'format' | 'style'> {
  width: number;
  height: number;
}

export const buildSliceAdReactNode = (width: number, height: number) => (
  <SliseAd slotId={getSlotId()} pub="pub-25" width={width} height={height} />
);

const SliseAd = memo(({ width, height, ...restProps }: CunningSliseAdProps) => {
  useDidMount(() => require('./slise-ad.embed'));

  return <OriginalSliseAd {...restProps} format={`${width}x${height}`} style={{ width, height }} />;
});
