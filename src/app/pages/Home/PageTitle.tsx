import React, { memo } from 'react';

import { useEvmTokenMetadataSelector } from 'app/store/evm/tokens-metadata/selectors';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { getAssetSymbol, useTezosAssetMetadata } from 'lib/metadata';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { HomeProps } from './interfaces';
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

export const PageTitle = memo<HomeProps>(({ chainKind, chainId, assetSlug }) => {
  if (!chainKind || !chainId || !assetSlug) return null;

  return chainKind === TempleChainKind.Tezos ? (
    <TezosPageTitle tezosChainId={chainId} assetSlug={assetSlug} />
  ) : (
    <EvmPageTitle evmChainId={Number(chainId)} assetSlug={assetSlug} />
  );
});

const TezosPageTitle = memo<TezosProps>(({ assetSlug, tezosChainId }) => {
  const assetMetadata = useTezosAssetMetadata(assetSlug, tezosChainId);
  const assetSymbol = getAssetSymbol(assetMetadata);

  return <BaseTitle assetSymbol={assetSymbol} />;
});

const EvmPageTitle = memo<EvmProps>(({ assetSlug, evmChainId }) => {
  const network = useEvmChainByChainId(evmChainId);
  const assetMetadata = useEvmTokenMetadataSelector(evmChainId, assetSlug);

  const metadata = isEvmNativeTokenSlug(assetSlug) ? network?.currency : assetMetadata;

  const assetSymbol = getAssetSymbol(metadata);

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
