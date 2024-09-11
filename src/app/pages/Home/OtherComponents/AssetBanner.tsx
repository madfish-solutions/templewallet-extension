import React, { memo } from 'react';

import Money from 'app/atoms/Money';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useEvmTokenMetadataSelector } from 'app/store/evm/tokens-metadata/selectors';
import AddressChip from 'app/templates/AddressChip';
import { TezosAssetIcon, EvmTokenIcon } from 'app/templates/AssetIcon';
import { EvmBalance, TezosBalance } from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { getTokenName, getAssetSymbol, useTezosAssetMetadata } from 'lib/metadata';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { useAccountAddressForEvm, useAccountAddressForTezos, useTezosChainByChainId } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { HomeSelectors, TokenPageSelectors } from '../selectors';

interface AssetBannerProps {
  chainKind: string;
  chainId: string;
  assetSlug: string;
}

export const AssetBanner = memo<AssetBannerProps>(({ chainKind, chainId, assetSlug }) =>
  chainKind === TempleChainKind.Tezos ? (
    <TezosAssetBanner tezosChainId={chainId} assetSlug={assetSlug} />
  ) : (
    <EvmAssetBanner evmChainId={Number(chainId)} assetSlug={assetSlug} />
  )
);

interface TezosAssetBannerProps {
  tezosChainId: string;
  assetSlug: string;
}

const TezosAssetBanner = memo<TezosAssetBannerProps>(({ tezosChainId, assetSlug }) => {
  const accountTezAddress = useAccountAddressForTezos();
  const network = useTezosChainByChainId(tezosChainId);

  if (!accountTezAddress || !network) throw new DeadEndBoundaryError();

  const assetMetadata = useTezosAssetMetadata(assetSlug, tezosChainId);
  const assetName = getTokenName(assetMetadata);
  const assetSymbol = getAssetSymbol(assetMetadata);

  return (
    <>
      <div className="flex items-center gap-x-2 my-3">
        <TezosAssetIcon tezosChainId={network.chainId} assetSlug={assetSlug} size={24} className="flex-shrink-0" />

        <div
          className="flex-grow text-font-medium font-normal text-gray-700 truncate"
          {...setTestID(TokenPageSelectors.tokenName)}
          {...setAnotherSelector('name', assetName)}
        >
          {assetName}
        </div>

        <AddressChip
          address={accountTezAddress}
          tezosNetwork={network}
          modeSwitchTestId={HomeSelectors.addressModeSwitchButton}
        />
      </div>

      <div className="flex items-center text-2xl">
        <TezosBalance network={network} address={accountTezAddress} assetSlug={assetSlug}>
          {balance => (
            <div className="flex flex-col">
              <div className="flex text-2xl flex-wrap">
                <Money smallFractionFont={false} fiat>
                  {balance}
                </Money>
                <span className="ml-1">{assetSymbol}</span>
              </div>

              <InFiat chainId={network.chainId} assetSlug={assetSlug} volume={balance} smallFractionFont={false}>
                {({ balance, symbol }) => (
                  <div className="mt-1 text-font-regular leading-5 text-gray-500 flex">
                    <span className="mr-1">≈</span>
                    {balance}
                    <span className="ml-1">{symbol}</span>
                  </div>
                )}
              </InFiat>
            </div>
          )}
        </TezosBalance>
      </div>
    </>
  );
});

interface EvmAssetBannerProps {
  evmChainId: number;
  assetSlug: string;
}

const EvmAssetBanner = memo<EvmAssetBannerProps>(({ evmChainId, assetSlug }) => {
  const accountEvmAddress = useAccountAddressForEvm();
  const network = useEvmChainByChainId(evmChainId);

  if (!accountEvmAddress || !network) throw new DeadEndBoundaryError();

  const tokenMetadata = useEvmTokenMetadataSelector(evmChainId, assetSlug);

  const metadata = isEvmNativeTokenSlug(assetSlug) ? network.currency : tokenMetadata;

  const assetName = getTokenName(metadata);
  const assetSymbol = getAssetSymbol(metadata);

  return (
    <>
      <div className="flex items-center gap-x-2 my-3">
        <div className="shrink-0 flex items-center justify-center">
          <EvmTokenIcon evmChainId={network.chainId} assetSlug={assetSlug} size={24} />
        </div>

        <div
          className="flex-grow text-sm font-normal text-gray-700 truncate"
          {...setTestID(TokenPageSelectors.tokenName)}
          {...setAnotherSelector('name', assetName)}
        >
          {assetName}
        </div>

        <AddressChip address={accountEvmAddress} modeSwitchTestId={HomeSelectors.addressModeSwitchButton} />
      </div>

      <div className="flex items-center text-2xl">
        <EvmBalance network={network} address={accountEvmAddress} assetSlug={assetSlug}>
          {balance => (
            <div className="flex flex-col">
              <div className="flex text-2xl flex-wrap">
                <Money smallFractionFont={false}>{balance}</Money>
                <span className="ml-1">{assetSymbol}</span>
              </div>

              <InFiat evm chainId={network.chainId} assetSlug={assetSlug} volume={balance} smallFractionFont={false}>
                {({ balance, symbol }) => (
                  <div className="mt-1 text-base leading-5 text-gray-500 flex">
                    <span className="mr-1">≈</span>
                    {balance}
                    <span className="ml-1">{symbol}</span>
                  </div>
                )}
              </InFiat>
            </div>
          )}
        </EvmBalance>
      </div>
    </>
  );
});
