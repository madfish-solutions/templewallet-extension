import React, { memo } from 'react';

import BigNumber from 'bignumber.js';

import InFiat from 'app/templates/InFiat';
import { T } from 'lib/i18n';
import { AssetMetadataBase, getAssetSymbol } from 'lib/metadata';

interface Props {
  assetSlug: string;
  assetMetadata?: AssetMetadataBase;
  amountValue: string;
  toFiat: boolean;
}

export const ConvertedInputAssetAmount = memo<Props>(({ assetSlug, assetMetadata, amountValue, toFiat }) => (
  <div className="-mb-3 flex">
    <span className="mr-1">≈</span>

    {toFiat ? (
      <InFiat assetSlug={assetSlug} volume={amountValue} roundingMode={BigNumber.ROUND_FLOOR}>
        {({ balance, symbol }) => (
          <>
            <span className="font-normal text-gray-700 mr-1 flex items-baseline">
              {balance}
              <span className="pr-px">{symbol}</span>
            </span>{' '}
            <T id="inFiat" />
          </>
        )}
      </InFiat>
    ) : (
      <>
        <span className="font-normal text-gray-700 mr-1">{amountValue}</span>{' '}
        <T id="inAsset" substitutions={getAssetSymbol(assetMetadata, true)} />
      </>
    )}
  </div>
));
