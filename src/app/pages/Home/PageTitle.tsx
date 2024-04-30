import React, { memo, useEffect } from 'react';

import { useEvmTokenMetadata } from 'app/hooks/evm/metadata';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { getAssetSymbol, useAssetMetadata } from 'lib/metadata';
import { TempleChainKind } from 'temple/types';

import { HomeProps } from './interfaces';
import { TokenPageSelectors } from './OtherComponents/TokenPage.selectors';

interface BaseProps {
  assetSlug: string;
}
interface TezosProps extends BaseProps {
  tezosChainId: string;
}
interface EvmProps extends BaseProps {
  evmChainId: number;
}

export const PageTitle = memo<HomeProps>(({ chainKind, chainId, assetSlug }) => {
  if (!chainKind || !chainId || !assetSlug) return null;

  return chainKind === TempleChainKind.Tezos ? (
    <TezosPageTitle tezosChainId={chainId} assetSlug={assetSlug} />
  ) : (
    <EvmPageTitle evmChainId={Number(chainId)} assetSlug={assetSlug} />
  );
});

const TezosPageTitle = memo<TezosProps>(({ assetSlug, tezosChainId }) => {
  const assetMetadata = useAssetMetadata(assetSlug, tezosChainId);
  const assetSymbol = getAssetSymbol(assetMetadata);

  return <BaseTitle assetSymbol={assetSymbol} />;
});

const EvmPageTitle = memo<EvmProps>(({ assetSlug, evmChainId }) => {
  const assetMetadata = useEvmTokenMetadata(evmChainId, assetSlug);
  const assetSymbol = getAssetSymbol(assetMetadata);

  useEffect(() => {
    (async () => {})();
  }, []);

  return <BaseTitle assetSymbol={assetSymbol} />;
});

const BaseTitle = memo<{ assetSymbol: string }>(({ assetSymbol }) => (
  <span
    className="font-normal"
    {...setTestID(TokenPageSelectors.pageName)}
    {...setAnotherSelector('symbol', assetSymbol)}
  >
    {assetSymbol}
  </span>
));
