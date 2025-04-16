import React, { FC, memo, ReactNode, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import Money from 'app/atoms/Money';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { EvmAssetIconWithNetwork, TezosTokenIconWithNetwork } from 'app/templates/AssetIcon';
import { BalanceProps, EvmBalance, TezosBalance } from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { t } from 'lib/i18n';
import {
  getTokenName,
  getAssetSymbol,
  AssetMetadataBase,
  useCategorizedTezosAssetMetadata,
  useEvmCategorizedAssetMetadata
} from 'lib/metadata';
import { EvmAssetMetadataBase } from 'lib/metadata/types';
import { useAccountAddressForEvm, useAccountAddressForTezos, useTezosChainByChainId } from 'temple/front';
import { ChainOfKind, OneOfChains, useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { TokenPageSelectors } from './selectors';
import { TokenPrice } from './TokenPrice';

type ChainId<T extends TempleChainKind> = ChainOfKind<T>['chainId'];

interface AssetBannerProps<T extends TempleChainKind> {
  chainId: ChainId<T>;
  assetSlug: string;
}

const AssetBannerHOC = <T extends TempleChainKind>(
  useAccountAddress: () => (T extends TempleChainKind.EVM ? HexString : string) | undefined,
  useChainByChainId: SyncFn<ChainId<T>, ChainOfKind<T> | null | undefined>,
  useCategorizedAssetMetadata: (
    assetSlug: string,
    chainId: ChainId<T>
  ) => (T extends TempleChainKind.EVM ? EvmAssetMetadataBase : AssetMetadataBase) | undefined,
  Balance: FC<BalanceProps<T>>
) =>
  memo<AssetBannerProps<T>>(({ chainId, assetSlug }) => {
    const accountAddress = useAccountAddress();
    const network = useChainByChainId(chainId);

    console.log('oy vey 1', accountAddress, network, chainId, assetSlug);

    if (!accountAddress || !network) throw new DeadEndBoundaryError();

    const forEVM = network.kind === TempleChainKind.EVM;
    const metadata = useCategorizedAssetMetadata(assetSlug, chainId);
    const assetName = getTokenName(metadata);
    const assetSymbol = getAssetSymbol(metadata);

    return (
      <>
        <div className="flex items-center gap-x-1">
          {forEVM ? (
            <EvmAssetIconWithNetwork
              evmChainId={network.chainId}
              assetSlug={assetSlug}
              size={40}
              className="shrink-0"
            />
          ) : (
            <TezosTokenIconWithNetwork
              tezosChainId={network.chainId}
              assetSlug={assetSlug}
              size={40}
              className="shrink-0"
            />
          )}

          <NamesComp assetName={assetName} network={network} />

          <TokenPrice assetSlug={assetSlug} chainId={network.chainId} forEVM={forEVM} />
        </div>

        <div className="flex flex-col">
          <Balance network={network} address={accountAddress} assetSlug={assetSlug}>
            {balance => (
              <>
                <AmountComp balance={balance} assetSymbol={assetSymbol} />

                <InFiat evm chainId={network.chainId} assetSlug={assetSlug} volume={balance} smallFractionFont={false}>
                  {({ balance, symbol }) => <FiatValueComp balance={balance} symbol={symbol} />}
                </InFiat>
              </>
            )}
          </Balance>
        </div>
      </>
    );
  });

export const TezosAssetBanner = AssetBannerHOC(
  useAccountAddressForTezos,
  useTezosChainByChainId,
  useCategorizedTezosAssetMetadata,
  TezosBalance
);

export const EvmAssetBanner = AssetBannerHOC(
  useAccountAddressForEvm,
  useEvmChainByChainId,
  useEvmCategorizedAssetMetadata,
  EvmBalance
);

const NamesComp: FC<{ assetName: string; network: OneOfChains }> = ({ assetName, network }) => {
  const networkName = useMemo(() => (network.nameI18nKey ? t(network.nameI18nKey) : network.name), [network]);

  return (
    <div className="flex-grow flex flex-col gap-y-1 pr-6">
      <span
        className="text-font-medium-bold"
        {...setTestID(TokenPageSelectors.tokenName)}
        {...setAnotherSelector('name', assetName)}
      >
        {assetName}
      </span>

      <span className="text-font-description">{networkName}</span>
    </div>
  );
};

const AmountComp: FC<{ balance: BigNumber; assetSymbol: string }> = ({ balance, assetSymbol }) => (
  <div className="text-font-num-bold-24 leading-9">
    <Money smallFractionFont={false} cryptoDecimals={balance.gte(1000) ? 4 : 6}>
      {balance}
    </Money>
    <span className="ml-1">{assetSymbol}</span>
  </div>
);

const FiatValueComp: FC<{ balance: ReactNode; symbol: string }> = ({ balance, symbol }) => (
  <div className="text-font-num-14 text-grey-1 flex">
    <span>≈</span>
    {balance}
    <span className="ml-0.5">{symbol}</span>
  </div>
);
