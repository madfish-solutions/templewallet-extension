import React, { memo } from 'react';

import BigNumber from 'bignumber.js';

import InFiat from 'app/templates/InFiat';
import { AssetMetadataBase, getAssetSymbol } from 'lib/metadata';

interface Props {
  tezosChainId: string;
  assetSlug: string;
  assetMetadata?: AssetMetadataBase;
  amountValue: string;
  toFiat: boolean;
}

export const ConvertedInputAssetAmount = memo<Props>(
  ({ tezosChainId, assetSlug, assetMetadata, amountValue, toFiat }) => {
    if (toFiat)
      return (
        <InFiat
          chainId={tezosChainId}
          assetSlug={assetSlug}
          volume={amountValue}
          smallFractionFont={false}
          roundingMode={BigNumber.ROUND_FLOOR}
        >
          {({ balance, symbol }) => (
            <div className="flex items-baseline text-font-num-12 text-grey-1">
              <span>≈</span>
              <span className="mx-1">{balance}</span>
              <span>{symbol}</span>
            </div>
          )}
        </InFiat>
      );

    return (
      <div className="flex items-baseline text-font-num-12 text-grey-1">
        <span>≈</span>
        <span className="mx-1">{amountValue}</span>
        <span>{getAssetSymbol(assetMetadata, true)}</span>
      </div>
    );
  }
);
