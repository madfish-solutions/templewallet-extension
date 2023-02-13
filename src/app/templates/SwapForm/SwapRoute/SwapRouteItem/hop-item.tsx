import React, { FC } from 'react';

import classNames from 'clsx';

import { useRoute3DexesSelector } from 'app/store/route3/selectors';
import { AssetIcon } from 'app/templates/AssetIcon';
import { getDexName } from 'lib/route3/utils/get-dex-name';
import { DexTypeIcon } from 'lib/swap-router';
import { toTokenSlug } from 'lib/temple/assets';
import useTippy from 'lib/ui/useTippy';

interface Props {
  dexId: number;
  className?: string;
}

export const HopItem: FC<Props> = ({ dexId, className }) => {
  const { data: route3Dexes } = useRoute3DexesSelector();
  const dex = route3Dexes.find(dex => dex.id === dexId);

  const dexInfoDivRef = useTippy<HTMLDivElement>({
    trigger: 'mouseenter',
    hideOnClick: false,
    content: `Dex: ${getDexName(dex?.type)}`,
    animation: 'shift-away-subtle'
  });
  const tokenAInfoDivRef = useTippy<HTMLDivElement>({
    trigger: 'mouseenter',
    hideOnClick: false,
    content: `${dex?.token1.symbol}`,
    animation: 'shift-away-subtle'
  });
  const tokenBInfoDivRef = useTippy<HTMLDivElement>({
    trigger: 'mouseenter',
    hideOnClick: false,
    content: `${dex?.token2.symbol}`,
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
              dex?.token1.contract === null ? 'tez' : dex?.token1.contract ?? '',
              dex?.token1.tokenId ?? undefined
            )}
            size={24}
          />
        </div>
        <div ref={tokenBInfoDivRef}>
          <AssetIcon
            assetSlug={toTokenSlug(
              dex?.token2.contract === null ? 'tez' : dex?.token2.contract ?? '',
              dex?.token2.tokenId ?? undefined
            )}
            size={24}
          />
        </div>
      </div>
    </div>
  );
};
