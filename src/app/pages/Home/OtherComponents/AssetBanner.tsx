import React, { memo } from 'react';

import Money from 'app/atoms/Money';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useEvmTokenMetadata } from 'app/hooks/evm/metadata';
import AddressChip from 'app/templates/AddressChip';
import { AssetIcon, EvmAssetIcon } from 'app/templates/AssetIcon';
import { EvmBalance, TezosBalance } from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { getAssetName, getAssetSymbol, useAssetMetadata } from 'lib/metadata';
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

  const assetMetadata = useAssetMetadata(assetSlug, tezosChainId);
  const assetName = getAssetName(assetMetadata);
  const assetSymbol = getAssetSymbol(assetMetadata);

  return (
    <>
      <div className="flex justify-between items-center my-3">
        <div className="flex items-center">
          <AssetIcon tezosChainId={network.chainId} assetSlug={assetSlug} size={24} className="flex-shrink-0" />

          <div
            className="text-sm font-normal text-gray-700 truncate flex-1 ml-2"
            {...setTestID(TokenPageSelectors.tokenName)}
            {...setAnotherSelector('name', assetName)}
          >
            {assetName}
          </div>
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
              <div className="flex text-2xl">
                <Money smallFractionFont={false} fiat>
                  {balance}
                </Money>
                <span className="ml-1">{assetSymbol}</span>
              </div>

              <InFiat chainId={network.chainId} assetSlug={assetSlug} volume={balance} smallFractionFont={false}>
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

  const assetMetadata = useEvmTokenMetadata(evmChainId, assetSlug);
  const assetName = getAssetName(assetMetadata);
  const assetSymbol = getAssetSymbol(assetMetadata);

  return (
    <>
      <div className="flex justify-between items-center my-3">
        <div className="flex items-center">
          <EvmAssetIcon evmChainId={network.chainId} assetSlug={assetSlug} size={24} className="flex-shrink-0" />

          <div
            className="text-sm font-normal text-gray-700 truncate flex-1 ml-2"
            {...setTestID(TokenPageSelectors.tokenName)}
            {...setAnotherSelector('name', assetName)}
          >
            {assetName}
          </div>
        </div>

        <AddressChip address={accountEvmAddress} modeSwitchTestId={HomeSelectors.addressModeSwitchButton} />
      </div>

      <div className="flex items-center text-2xl">
        <EvmBalance chainId={network.chainId} address={accountEvmAddress} assetSlug={assetSlug}>
          {balance => (
            <div className="flex flex-col">
              <div className="flex text-2xl">
                <Money smallFractionFont={false} fiat>
                  {balance}
                </Money>
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
