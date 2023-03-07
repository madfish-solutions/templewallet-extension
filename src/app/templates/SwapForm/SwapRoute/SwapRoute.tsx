import React, { FC, useState } from 'react';

import classNames from 'clsx';

import { ReactComponent as ChevronDown } from 'app/icons/chevron-down.svg';
import { ReactComponent as ChevronUp } from 'app/icons/chevron-up.svg';
import { useSwapParamsSelector } from 'app/store/swap/selectors';
import { T } from 'lib/i18n';

import { SwapRouteItem } from './SwapRouteItem/SwapRouteItem';

interface Props {
  className?: string;
}

export const SwapRoute: FC<Props> = ({ className }) => {
  const { data: swapParams } = useSwapParamsSelector();

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
              baseInput={swapParams.input ?? 0}
              baseOutput={swapParams.output ?? 0}
            />
          ))}
        </div>
      )}
    </>
  );
};
