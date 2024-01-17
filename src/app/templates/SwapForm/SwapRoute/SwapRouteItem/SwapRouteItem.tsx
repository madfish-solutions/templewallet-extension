import React, { FC } from 'react';

import { ReactComponent as Separator } from 'app/icons/separator.svg';
import { useSwapDexesSelector } from 'app/store/swap/selectors';
import { Route3Chain } from 'lib/route3/interfaces';

import { HopItem } from './hop-item';
import { SwapRouteAmounts } from './swap-route-amounts';

interface Props {
  baseInput: string | undefined;
  baseOutput: string | undefined;
  chain: Route3Chain;
  shouldShowInput: boolean;
  shouldShowOutput: boolean;
}

export const SwapRouteItem: FC<Props> = ({ chain, baseInput, baseOutput, shouldShowInput, shouldShowOutput }) => {
  const { data: route3Dexes } = useSwapDexesSelector();

  return (
    <div className="flex flex-1 justify-between relative">
      {shouldShowInput && <SwapRouteAmounts amount={chain.input} baseAmount={baseInput} className="text-left" />}
      <div className="flex flex-1 flex-row relative justify-around items-center">
        <div className="absolute w-full h-full flex items-center justify-center">
          <Separator />
        </div>

        {chain.hops.map((hop, index) => {
          const dex = route3Dexes.find(dex => dex.id === hop.dex);

          const aToken = hop.forward ? dex?.token1 : dex?.token2;
          const bToken = hop.forward ? dex?.token2 : dex?.token1;

          return <HopItem className="z-10" key={index} dex={dex} aToken={aToken} bToken={bToken} />;
        })}
      </div>

      {shouldShowOutput && <SwapRouteAmounts amount={chain.output} baseAmount={baseOutput} className="text-right" />}
    </div>
  );
};
