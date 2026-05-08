import React from 'react';

import { CrossChainAsset } from 'lib/cross-chain';
import { T } from 'lib/i18n';

import { CrossChainAmountInput } from './CrossChainAmountInput';
import { RecipientField } from './RecipientField';

interface Props {
  asset: CrossChainAsset;
  fromAsset: CrossChainAsset;
  amount: string;
  onAssetClick: EmptyFn;
  loading?: boolean;
}

export const GetCard: React.FC<Props> = ({ asset, fromAsset, amount, onAssetClick, loading }) => (
  <div className="flex flex-col gap-y-3 ">
    <CrossChainAmountInput
      label={<T id="get" />}
      asset={asset}
      amount={loading ? '' : amount}
      readOnly
      placeholder={loading ? '…' : '0.00'}
      onAssetClick={onAssetClick}
      footer={<RecipientField fromAsset={fromAsset} toAsset={asset} />}
    />
  </div>
);
