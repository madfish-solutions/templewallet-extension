import React, { FC } from 'react';

import classNames from 'clsx';

import { AssetIcon } from 'app/templates/AssetIcon';
import { Route3Dex } from 'lib/apis/route3/fetch-route3-dexes';
import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { getDexName } from 'lib/route3/utils/get-dex-name';
import { DexTypeIcon } from 'lib/swap-router';
import { toAssetSlug } from 'lib/temple/assets';
import { TEZ_TOKEN_SLUG } from 'lib/temple/front';
import useTippy from 'lib/ui/useTippy';

interface Props {
  dex: Route3Dex | undefined;
  aToken: Route3Token | undefined;
  bToken: Route3Token | undefined;
  className?: string;
}

export const HopItem: FC<Props> = ({ dex, aToken, bToken, className }) => {
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
            assetSlug={toAssetSlug(
              aToken?.contract === null ? TEZ_TOKEN_SLUG : aToken?.contract ?? '',
              aToken?.tokenId ?? undefined
            )}
            size={20}
          />
        </div>
        <div ref={tokenBInfoDivRef} style={{ marginLeft: -8 }}>
          <AssetIcon
            assetSlug={toAssetSlug(
              bToken?.contract === null ? TEZ_TOKEN_SLUG : bToken?.contract ?? '',
              bToken?.tokenId ?? undefined
            )}
            size={20}
          />
        </div>
      </div>
    </div>
  );
};
