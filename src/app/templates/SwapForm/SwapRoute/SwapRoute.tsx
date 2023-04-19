import React, { FC, useState } from 'react';

import { ReactComponent as ChevronDown } from 'app/icons/chevron-down.svg';
import { ReactComponent as ChevronUp } from 'app/icons/chevron-up.svg';
import { useSwapParamsSelector } from 'app/store/swap/selectors';
import { T } from 'lib/i18n';

import { SwapRouteItem } from './SwapRouteItem/SwapRouteItem';

export const SwapRoute: FC = () => {
  const {
    data: { chains, input, output }
  } = useSwapParamsSelector();

  const chainsCount = chains.length;
  const dexesCount = chains.reduce((accum, chain) => accum + chain.hops.length, 0);

  const [isVisible, setIsVisible] = useState(chainsCount > 0);

  const hadleToggleVisible = () => setIsVisible(prev => !prev);

  const Chevron = isVisible ? ChevronUp : ChevronDown;

  return (
    <>
      <p
        className="flex justify-between items-center text-xs text-gray-500 cursor-pointer"
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
      {isVisible && chains.length > 0 && (
        <div className="flex flex-col gap-2 mb-2">
          {chains.map((chain, index) => (
            <SwapRouteItem key={index} chain={chain} baseInput={input} baseOutput={output} />
          ))}
        </div>
      )}
    </>
  );
};
