import React, { FC } from 'react';

import classNames from 'clsx';

import { TradeOperation } from 'lib/swap-router/interface/trade.interface';
import { getDexName, getPoolName } from 'lib/swap-router/utils/trade-operation.utils';
import { useAssetMetadata } from 'lib/temple/front';
import useTippy from 'lib/ui/useTippy';

import AssetIcon from '../../../../AssetIcon';
import { DexTypeIcon } from './DexTypeIcon/DexTypeIcon';
import { ReactComponent as NextArrow } from './icons/next-arrow.svg';

interface Props {
  tradeOperation: TradeOperation;
  isShowNextArrow: boolean;
}

export const SwapRouteItem: FC<Props> = ({ tradeOperation, isShowNextArrow }) => {
  const aTokenMetadata = useAssetMetadata(tradeOperation.aTokenSlug);
  const bTokenMetadata = useAssetMetadata(tradeOperation.bTokenSlug);

  const swapInfoDivRef = useTippy<HTMLDivElement>({
    trigger: 'mouseenter',
    hideOnClick: false,
    content:
      aTokenMetadata &&
      bTokenMetadata &&
      `Dex: ${getDexName(tradeOperation.dexType)} \nPool: ${getPoolName(
        tradeOperation.direction,
        aTokenMetadata,
        bTokenMetadata
      )}`,
    animation: 'shift-away-subtle'
  });

  return (
    <>
      <div
        ref={swapInfoDivRef}
        className={classNames('flex flex-col items-center', 'px-4 py-2', 'border rounded-md border-gray-300')}
      >
        <DexTypeIcon dexType={tradeOperation.dexType} />
        <div className="flex mt-2">
          <AssetIcon assetSlug={tradeOperation.aTokenSlug} size={24} />
          <AssetIcon assetSlug={tradeOperation.bTokenSlug} size={24} className="-ml-1" />
        </div>
      </div>
      {isShowNextArrow && <NextArrow />}
    </>
  );
};
