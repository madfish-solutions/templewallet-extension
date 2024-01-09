import React, { FC, useEffect, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { BigNumber } from 'bignumber.js';

import { ReactComponent as ChevronDown } from 'app/icons/chevron-down.svg';
import { ReactComponent as ChevronUp } from 'app/icons/chevron-up.svg';
import { useSwapParamsSelector } from 'app/store/swap/selectors';
import { T } from 'lib/i18n';
import { AssetMetadataBase } from 'lib/metadata';
import { ROUTING_FEE_RATIO } from 'lib/route3/constants';
import { isSwapChains, Route3Chain } from 'lib/route3/interfaces';

import { LbPoolPart } from './lb-pool-part';
import { SwapRouteItem } from './SwapRouteItem/SwapRouteItem';

interface Props {
  isLbOutput: boolean;
  isLbInput: boolean;
  outputToken: AssetMetadataBase;
  routingFeeIsTakenFromOutput: boolean;
  className?: string;
}

export const SwapRoute: FC<Props> = ({
  isLbInput,
  isLbOutput,
  routingFeeIsTakenFromOutput,
  outputToken,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const {
    data: { input, output, ...chains }
  } = useSwapParamsSelector();

  const chainsHeap = useMemo(() => {
    let chainsHeapBeforeOutputFee: Route3Chain[] = [];

    if (isSwapChains(chains)) {
      chainsHeapBeforeOutputFee = chains.chains;
    } else {
      const { tzbtcChain, xtzChain } = chains;
      const tzbtcChains: Route3Chain[] =
        tzbtcChain.chains.length === 0
          ? [
              {
                input: tzbtcChain.input ?? '0',
                output: tzbtcChain.output ?? '0',
                hops: []
              }
            ]
          : tzbtcChain.chains;
      const xtzChains: Route3Chain[] =
        xtzChain.chains.length === 0
          ? [
              {
                input: xtzChain.input ?? '0',
                output: xtzChain.output ?? '0',
                hops: []
              }
            ]
          : xtzChain.chains;

      chainsHeapBeforeOutputFee = tzbtcChains.concat(xtzChains);
    }

    return routingFeeIsTakenFromOutput
      ? chainsHeapBeforeOutputFee.map(chain => ({
          ...chain,
          output: new BigNumber(chain.output)
            .times(ROUTING_FEE_RATIO)
            .toFixed(outputToken.decimals, BigNumber.ROUND_DOWN)
        }))
      : chainsHeapBeforeOutputFee;
  }, [chains, routingFeeIsTakenFromOutput, outputToken.decimals]);

  const totalChains = chainsHeap.length;

  useEffect(() => {
    if (totalChains === 0) {
      setIsVisible(false);
    }
  }, [totalChains]);

  const totalHops =
    chainsHeap.reduce((accum, chain) => accum + chain.hops.length, 0) +
    ((isLbInput || isLbOutput) && chainsHeap.length > 0 ? 1 : 0);
  const shouldShowRoute = isVisible && totalChains > 0;

  const outputAfterFee = useMemo(
    () =>
      routingFeeIsTakenFromOutput && isDefined(output)
        ? new BigNumber(output).times(ROUTING_FEE_RATIO).toFixed(outputToken.decimals, BigNumber.ROUND_DOWN)
        : output,
    [output, outputToken.decimals, routingFeeIsTakenFromOutput]
  );

  const hadleToggleVisible = () => setIsVisible(prev => !prev);

  const Chevron = isVisible ? ChevronUp : ChevronDown;

  return (
    <div className={className}>
      <p
        className="flex justify-between items-center text-xs text-gray-500 cursor-pointer"
        onClick={hadleToggleVisible}
      >
        <T id="swapRoute" />
        <span className="flex items-center gap-1">
          <span>
            <T id="route3ChainsDexes" substitutions={[totalChains, totalHops]} />
          </span>
          <span>
            <Chevron className={'h-4 w-auto stroke-3 stroke-current'} />
          </span>
        </span>
      </p>
      {shouldShowRoute && (
        <div className="flex flex-row items-center my-2">
          {isLbInput && <LbPoolPart isLbOutput={false} amount={input} totalChains={totalChains} />}
          <div className="flex flex-1 flex-col gap-2">
            {chainsHeap.map((chain, index) => (
              <SwapRouteItem
                key={index}
                chain={chain}
                baseInput={input}
                baseOutput={output}
                shouldShowInput={!isLbInput}
                shouldShowOutput={!isLbOutput}
              />
            ))}
          </div>
          {isLbOutput && <LbPoolPart isLbOutput amount={outputAfterFee} totalChains={totalChains} />}
        </div>
      )}
    </div>
  );
};
