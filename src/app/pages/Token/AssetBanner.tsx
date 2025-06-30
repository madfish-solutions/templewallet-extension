import React, { FC, memo, ReactNode, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import Money from 'app/atoms/Money';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import { BalanceProps, EvmBalance, TezosBalance } from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { t } from 'lib/i18n';
import {
  getAssetSymbol,
  getTokenName,
  useCategorizedTezosAssetMetadata,
  useEvmCategorizedAssetMetadata
} from 'lib/metadata';
import { ChainAssetMetadata } from 'lib/metadata/types';
import { useAccountAddressForEvm, useAccountAddressForTezos, useTezosChainByChainId } from 'temple/front';
import { ChainId, ChainOfKind, OneOfChains, PublicKeyHash, useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { TokenPageSelectors } from './selectors';
import { TokenPrice } from './TokenPrice';

interface AssetBannerProps<T extends TempleChainKind> {
  chainId: ChainId<T>;
  assetSlug: string;
}

interface AssetBannerHOCConfig<T extends TempleChainKind> {
  useAccountAddress: () => PublicKeyHash<T> | undefined;
  useChainByChainId: SyncFn<ChainId<T>, ChainOfKind<T> | null | undefined>;
  useCategorizedAssetMetadata: (assetSlug: string, chainId: ChainId<T>) => ChainAssetMetadata<T> | undefined;
  Balance: FC<BalanceProps<T>>;
  AssetIconWithNetwork: FC<{ assetSlug: string; chainId: ChainId<T>; size: number; className?: string }>;
  chainKind: T;
}

const AssetBannerHOC = <T extends TempleChainKind>({
  useAccountAddress,
  useChainByChainId,
  useCategorizedAssetMetadata,
  Balance,
  AssetIconWithNetwork,
  chainKind
}: AssetBannerHOCConfig<T>) =>
  memo<AssetBannerProps<T>>(({ chainId, assetSlug }) => {
    const accountAddress = useAccountAddress();
    const network = useChainByChainId(chainId);

    if (!accountAddress || !network) throw new DeadEndBoundaryError();

    const assetMetadata = useCategorizedAssetMetadata(assetSlug, chainId);
    const assetName = getTokenName(assetMetadata);
    const assetSymbol = getAssetSymbol(assetMetadata);

    const isEVM = chainKind === TempleChainKind.EVM;

    return (
      <>
        <div className="flex items-center gap-x-1">
          <AssetIconWithNetwork assetSlug={assetSlug} chainId={chainId} size={40} className="shrink-0" />

          <NamesComp assetName={assetName} network={network} />

          <TokenPrice assetSlug={assetSlug} chainId={chainId} forEVM={isEVM} />
        </div>

        <div className="flex flex-col">
          <Balance
            network={network}
            address={accountAddress}
            assetSlug={assetSlug}
            forceFirstRefreshOnChain={isEVM ? true : undefined}
          >
            {balance => (
              <>
                <AmountComp balance={balance} assetSymbol={assetSymbol} />

                <InFiat chainId={chainId} assetSlug={assetSlug} volume={balance} smallFractionFont={false} evm={isEVM}>
                  {({ balance, symbol }) => <FiatValueComp balance={balance} symbol={symbol} />}
                </InFiat>
              </>
            )}
          </Balance>
        </div>
      </>
    );
  });

export const TezosAssetBanner = AssetBannerHOC({
  useAccountAddress: useAccountAddressForTezos,
  useChainByChainId: useTezosChainByChainId,
  useCategorizedAssetMetadata: useCategorizedTezosAssetMetadata,
  Balance: TezosBalance,
  AssetIconWithNetwork: ({ chainId, ...restProps }) => (
    <TezosAssetIconWithNetwork tezosChainId={chainId} {...restProps} />
  ),
  chainKind: TempleChainKind.Tezos
});

export const EvmAssetBanner = AssetBannerHOC({
  useAccountAddress: useAccountAddressForEvm,
  useChainByChainId: useEvmChainByChainId,
  useCategorizedAssetMetadata: useEvmCategorizedAssetMetadata,
  Balance: EvmBalance,
  AssetIconWithNetwork: ({ chainId, ...restProps }) => <EvmAssetIconWithNetwork evmChainId={chainId} {...restProps} />,
  chainKind: TempleChainKind.EVM
});

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
