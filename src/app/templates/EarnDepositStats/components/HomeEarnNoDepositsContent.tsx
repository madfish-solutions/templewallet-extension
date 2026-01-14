import React, { FC, memo, ReactNode } from 'react';

import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { ETHEREUM_APR, TEZOS_APY } from 'lib/constants';
import { ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';

export const HomeEarnNoDepositsContent = memo(() => (
  <div className="flex flex-row gap-4 bg-background">
    <EarnOpportunityItem
      Icon={<EvmAssetIconWithNetwork assetSlug={EVM_TOKEN_SLUG} evmChainId={ETHEREUM_MAINNET_CHAIN_ID} size={24} />}
      symbol="ETH"
      displayRate={`${ETHEREUM_APR}% APR`}
    />
    <EarnOpportunityItem
      Icon={<TezosAssetIconWithNetwork assetSlug={TEZ_TOKEN_SLUG} tezosChainId={TEZOS_MAINNET_CHAIN_ID} size={24} />}
      symbol="TEZ"
      displayRate={`${TEZOS_APY}% APY`}
    />
  </div>
));

interface EarnOpportunityItemProps {
  Icon?: ReactNode;
  symbol: string;
  displayRate: string;
}

const EarnOpportunityItem: FC<EarnOpportunityItemProps> = ({ Icon, symbol, displayRate }) => (
  <div className="flex items-center justify-center gap-2 px-2">
    {Icon}

    <div className="flex items-center gap-1 whitespace-nowrap">
      <span className="text-font-description-bold">{symbol}</span>
      <span className="text-font-num-12 text-grey-1">{displayRate}</span>
    </div>
  </div>
);
