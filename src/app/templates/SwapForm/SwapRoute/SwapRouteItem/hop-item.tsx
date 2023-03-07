import React, { FC } from 'react';

import classNames from 'clsx';

import { useSwapDexesSelector } from 'app/store/swap/selectors';
import { AssetIcon } from 'app/templates/AssetIcon';
import { Route3Hop } from 'lib/apis/route3/fetch-route3-swap-params';
import { getDexName } from 'lib/route3/utils/get-dex-name';
import { DexTypeIcon } from 'lib/swap-router';
import { toTokenSlug } from 'lib/temple/assets';
import useTippy from 'lib/ui/useTippy';

interface Props {
  hop: Route3Hop;
  className?: string;
}

export const HopItem: FC<Props> = ({ hop, className }) => {
  const { data: route3Dexes } = useSwapDexesSelector();
  const dex = route3Dexes.find(dex => dex.id === hop.dex);

  const aToken = hop.forward ? dex?.token1 : dex?.token2;
  const bToken = hop.forward ? dex?.token2 : dex?.token1;

  const dexInfoDivRef = useTippy<HTMLDivElement>({
    trigger: 'mouseenter',
    hideOnClick: false,
    content: `Dex: ${getDexName(dex?.type)}`,
    animation: 'shift-away-subtle'
  });
  const tokenAInfoDivRef = useTippy<HTMLDivElement>({
    trigger: 'mouseenter',
    hideOnClick: false,
    content: `${aToken?.symbol}`,
    animation: 'shift-away-subtle'
  });
  const tokenBInfoDivRef = useTippy<HTMLDivElement>({
    trigger: 'mouseenter',
    hideOnClick: false,
    content: `${bToken?.symbol}`,
    animation: 'shift-away-subtle'
  });

  return (
    <div className={classNames(className, 'flex items-center p-1 border border-gray-400 rounded-lg bg-white')}>
      <div ref={dexInfoDivRef}>
        <DexTypeIcon dexType={dex?.type ?? null} />
      </div>
      <div className="flex items-center ml-2">
        <div ref={tokenAInfoDivRef}>
          <AssetIcon
            assetSlug={toTokenSlug(
              aToken?.contract === null ? 'tez' : aToken?.contract ?? '',
              aToken?.tokenId ?? undefined
            )}
            size={20}
          />
        </div>
        <div ref={tokenBInfoDivRef} style={{ marginLeft: -8 }}>
          <AssetIcon
            assetSlug={toTokenSlug(
              bToken?.contract === null ? 'tez' : bToken?.contract ?? '',
              bToken?.tokenId ?? undefined
            )}
            size={20}
          />
        </div>
      </div>
    </div>
  );
};
