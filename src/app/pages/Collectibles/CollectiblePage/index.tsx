import React, { memo } from 'react';

import { TempleChainKind } from 'temple/types';

import { EvmContent } from './components/EvmContent';
import { TezosContent } from './components/TezosContent';

interface Props {
  chainKind: string;
  chainId: string;
  assetSlug: string;
}

export const CollectiblePage = memo<Props>(({ chainKind, chainId, assetSlug }) =>
  chainKind === TempleChainKind.Tezos ? (
    <TezosContent tezosChainId={chainId} assetSlug={assetSlug} />
  ) : (
    <EvmContent evmChainId={Number(chainId)} assetSlug={assetSlug} />
  )
);
