import React, { memo } from 'react';

import { setAnotherSelector, setTestID } from 'lib/analytics';
import { getAssetSymbol, useCategorizedTezosAssetMetadata, useEvmCategorizedAssetMetadata } from 'lib/metadata';

import { TokenPageSelectors } from './selectors';

interface BaseProps {
  assetSlug: string;
}
interface TezosProps extends BaseProps {
  tezosChainId: string;
}

interface EvmProps extends BaseProps {
  evmChainId: number;
}

export const TezosPageTitle = memo<TezosProps>(({ assetSlug, tezosChainId }) => {
  const assetMetadata = useCategorizedTezosAssetMetadata(assetSlug, tezosChainId);
  const assetSymbol = getAssetSymbol(assetMetadata);

  return <BaseTitle assetSymbol={assetSymbol} />;
});

export const EvmPageTitle = memo<EvmProps>(({ assetSlug, evmChainId }) => {
  const assetMetadata = useEvmCategorizedAssetMetadata(assetSlug, evmChainId);
  const assetSymbol = getAssetSymbol(assetMetadata);

  return <BaseTitle assetSymbol={assetSymbol} />;
});

const BaseTitle = memo<{ assetSymbol: string }>(({ assetSymbol }) => (
  <span {...setTestID(TokenPageSelectors.pageName)} {...setAnotherSelector('symbol', assetSymbol)}>
    {assetSymbol}
  </span>
));
