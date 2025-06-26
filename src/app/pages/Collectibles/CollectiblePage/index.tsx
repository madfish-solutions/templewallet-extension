import React, { memo } from 'react';

import { TempleChainKind } from 'temple/types';

import { EvmContent } from './contents/Evm';
import { TezosContent } from './contents/Tezos';

interface Props {
  chainKind: string;
  chainId: string;
  assetSlug: string;
}

export const CollectiblePage = memo<Props>(({ chainKind, chainId, assetSlug }) =>
  chainKind === TempleChainKind.Tezos ? (
    <TezosContent chainId={chainId} assetSlug={assetSlug} />
  ) : (
    <EvmContent chainId={Number(chainId)} assetSlug={assetSlug} />
  )
);
