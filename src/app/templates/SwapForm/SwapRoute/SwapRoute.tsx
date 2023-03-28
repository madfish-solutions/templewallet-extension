import React, { FC, useState } from 'react';

import classNames from 'clsx';

import { ReactComponent as ChevronDown } from 'app/icons/chevron-down.svg';
import { ReactComponent as ChevronUp } from 'app/icons/chevron-up.svg';
import { Route3SwapParamsResponse } from 'lib/apis/route3/fetch-route3-swap-params';
import { T } from 'lib/i18n';
import { ZERO } from 'lib/route3/constants';

import { SwapRouteItem } from './SwapRouteItem/SwapRouteItem';

interface Props {
  className?: string;
  swapParams: Route3SwapParamsResponse;
}

export const SwapRoute: FC<Props> = ({ className, swapParams }) => {
  const [isVisible, setIsVisible] = useState(false);

  const chainsCount = swapParams.chains.length;
  const dexesCount = swapParams.chains.reduce((accum, chain) => accum + chain.hops.length, 0);

  const hadleToggleVisible = () => setIsVisible(prev => !prev);

  const Chevron = isVisible ? ChevronUp : ChevronDown;

  return (
    <>
      <p
        className={classNames(className, 'flex justify-between items-center text-xs text-gray-500 cursor-pointer')}
        onClick={hadleToggleVisible}
      >
        <T id="swapRoute" />
        <span className="flex items-center gap-1">
          <span>
            <T id="route3ChainsDexes" substitutions={[chainsCount, dexesCount]} />
          </span>
          <span>
            <Chevron className={'h-4 w-auto stroke-3 stroke-current'} />
          </span>
        </span>
      </p>
      {isVisible && swapParams.chains.length > 0 && (
        <div className="flex flex-col gap-2 mb-2">
          {swapParams.chains.map((chain, index) => (
            <SwapRouteItem
              key={index}
              chain={chain}
              baseInput={swapParams.input ?? ZERO}
              baseOutput={swapParams.output ?? ZERO}
            />
          ))}
        </div>
      )}
    </>
  );
};
