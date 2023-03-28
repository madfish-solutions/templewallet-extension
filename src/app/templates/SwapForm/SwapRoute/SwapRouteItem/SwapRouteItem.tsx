import React, { FC } from 'react';

import { BigNumber } from 'bignumber.js';

import { ReactComponent as Separator } from 'app/icons/separator.svg';
import { Route3Chain } from 'lib/apis/route3/fetch-route3-swap-params';

import { HopItem } from './hop-item';

interface Props {
  baseInput: BigNumber;
  baseOutput: BigNumber;
  chain: Route3Chain;
}

const DECIMALS_COUNT = 1;
const PERCENTAGE = new BigNumber(100);

const calculatePercentage = (base: BigNumber, part: number) =>
  PERCENTAGE.multipliedBy(part).dividedBy(base).toFixed(DECIMALS_COUNT);

export const SwapRouteItem: FC<Props> = ({ chain, baseInput, baseOutput }) => (
  <div className="flex justify-between relative">
    <div className="absolute w-full h-full flex items-center justify-center">
      <Separator />
    </div>
    <div className="z-10">
      <div className="text-gray-600">{chain.input.toFixed(DECIMALS_COUNT)}</div>
      <div className="text-blue-500">{calculatePercentage(baseInput, chain.input)}%</div>
    </div>
    {chain.hops.map((hop, index) => (
      <HopItem className="z-10" key={index} hop={hop} />
    ))}

    <div className="z-10">
      <div className="text-right text-gray-600">{chain.output.toFixed(DECIMALS_COUNT)}</div>
      <div className="text-right text-blue-500">{calculatePercentage(baseOutput, chain.output)}%</div>
    </div>
  </div>
);
