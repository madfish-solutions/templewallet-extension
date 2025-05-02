import React, { memo, useMemo } from 'react';

import { parseChainAssetSlug } from 'lib/assets/utils';
import { TempleChainKind } from 'temple/types';

import { EvmForm } from './EvmForm';
import { ReviewData } from './interfaces';
import { TezosForm } from './TezosForm';

interface Props {
  selectedChainAssetSlug: string;
  onReview: (data: ReviewData) => void;
  onSelectAssetClick: EmptyFn;
}

export const Form = memo<Props>(({ selectedChainAssetSlug, ...rest }) => {
  const [chainKind, chainId, assetSlug] = useMemo(
    () => parseChainAssetSlug(selectedChainAssetSlug),
    [selectedChainAssetSlug]
  );

  if (chainKind === TempleChainKind.EVM) {
    return <EvmForm assetSlug={assetSlug} chainId={chainId as number} {...rest} />;
  }

  return <TezosForm assetSlug={assetSlug} chainId={chainId as string} {...rest} />;
});
