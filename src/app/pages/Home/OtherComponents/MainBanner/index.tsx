import React, { memo, FC, useMemo } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms';
import Money from 'app/atoms/Money';
import { useEvmTokenMetadata } from 'app/hooks/evm/metadata';
import { useTotalBalance } from 'app/hooks/use-total-balance';
import { ContentContainer } from 'app/layouts/ContentContainer';
import { dispatch } from 'app/store';
import { toggleBalanceModeAction } from 'app/store/settings/actions';
import { useBalanceModeSelector } from 'app/store/settings/selectors';
import { BalanceMode } from 'app/store/settings/state';
import AddressChip from 'app/templates/AddressChip';
import { AssetIcon, EvmAssetIcon } from 'app/templates/AssetIcon';
import { EvmBalance, TezosBalance } from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { useFiatCurrency } from 'lib/fiat-currency';
import { t, T } from 'lib/i18n';
import { TezosLogoIcon } from 'lib/icons';
import { getAssetName, getAssetSymbol, getTezosGasMetadata, useAssetMetadata } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import { atomsToTokens } from 'lib/temple/helpers';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import useTippy from 'lib/ui/useTippy';
import { getReadOnlyEvm } from 'temple/evm';
import {
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useEthereumMainnetChain,
  useTezosChainByChainId,
  useTezosMainnetChain
} from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { useEvmChainByChainId } from '../../../../../temple/front/chains';
import { HomeSelectors } from '../../Home.selectors';
import { HomeProps } from '../../interfaces';
import { TokenPageSelectors } from '../TokenPage.selectors';

import { BalanceFiat } from './BalanceFiat';
import { BalanceGas } from './BalanceGas';

const MainBanner = memo<HomeProps>(({ chainKind, chainId, assetSlug }) => {
  return chainKind && chainId && assetSlug ? (
    <AssetBanner chainKind={chainKind} chainId={chainId} assetSlug={assetSlug} />
  ) : (
    <TotalVolumeBanner />
  );
});

export default MainBanner;

const TotalVolumeBanner = () => {
  const tezosMainnetChain = useTezosMainnetChain();
  const tezosAddress = useAccountAddressForTezos();
  const evmAddress = useAccountAddressForEvm();

  return (
    <ContentContainer className="flex items-start justify-between mb-4">
      {tezosAddress ? (
        <TezosBalanceInfo network={tezosMainnetChain} accountPkh={tezosAddress} />
      ) : evmAddress ? (
        <EvmBalanceInfo address={evmAddress} />
      ) : null}

      <div className="flex flex-col gap-y-1 items-end">
        {tezosAddress ? (
          <AddressChip
            address={tezosAddress}
            tezosNetwork={tezosMainnetChain}
            testID={HomeSelectors.publicAddressButton}
          />
        ) : null}
        {evmAddress ? <AddressChip address={evmAddress} /> : null}
      </div>
    </ContentContainer>
  );
};

interface TezosBalanceInfoProps {
  network: TezosNetworkEssentials;
  accountPkh: string;
}

const TezosBalanceInfo: FC<TezosBalanceInfoProps> = ({ network, accountPkh }) => {
  const { chainId } = network;
  const isMainnet = chainId === TEZOS_MAINNET_CHAIN_ID;
  const totalBalanceInDollar = useTotalBalance(accountPkh, chainId);
  const balanceMode = useBalanceModeSelector();

  const {
    selectedFiatCurrency: { name: fiatName, symbol: fiatSymbol }
  } = useFiatCurrency();

  const { name: gasTokenName, symbol: gasTokenSymbol } = getTezosGasMetadata(chainId);

  const tippyProps = useMemo(
    () => ({
      trigger: 'mouseenter',
      hideOnClick: false,
      content: t('showInGasOrFiat', [fiatName, gasTokenSymbol]),
      animation: 'shift-away-subtle'
    }),
    [fiatName, gasTokenSymbol]
  );

  const buttonRef = useTippy<HTMLButtonElement>(tippyProps);

  const nextBalanceMode = balanceMode === BalanceMode.Fiat ? BalanceMode.Gas : BalanceMode.Fiat;

  const handleTvlModeToggle = () => dispatch(toggleBalanceModeAction(nextBalanceMode));

  const isFiatMode = balanceMode === BalanceMode.Fiat;
  const shouldShowFiatBanner = isMainnet && isFiatMode;

  return (
    <div className="flex flex-col justify-between items-start">
      <div className="flex items-center">
        {isMainnet && (
          <Button
            ref={buttonRef}
            style={{ height: '22px', width: '22px' }}
            className={clsx(
              'mr-1 p-1',
              'bg-gray-100',
              'rounded-sm shadow-xs',
              'text-base font-medium',
              'hover:text-gray-600 text-gray-500 leading-none select-none',
              'transition ease-in-out duration-300',
              'inline-flex items-center justify-center'
            )}
            onClick={handleTvlModeToggle}
            testID={HomeSelectors.fiatTezSwitchButton}
            testIDProperties={{ toValue: nextBalanceMode }}
          >
            {isFiatMode ? fiatSymbol : <TezosLogoIcon />}
          </Button>
        )}

        <div className="text-sm font-medium text-gray-700" {...setTestID(HomeSelectors.fiatTezSwitchText)}>
          {shouldShowFiatBanner ? (
            <T id="totalEquityValue" />
          ) : (
            <>
              {gasTokenName} <T id="balance" />
            </>
          )}
        </div>
      </div>

      <div className="flex items-center text-2xl">
        {shouldShowFiatBanner ? (
          <BalanceFiat totalBalanceInDollar={totalBalanceInDollar} currency={fiatSymbol} />
        ) : (
          <BalanceGas
            network={network}
            totalBalanceInDollar={totalBalanceInDollar}
            currency={gasTokenSymbol}
            accountPkh={accountPkh}
          />
        )}
      </div>
    </div>
  );
};

const EvmBalanceInfo: FC<{ address: HexString }> = ({ address }) => {
  const mainnetChain = useEthereumMainnetChain();
  const currency = mainnetChain.currency;

  const viemClient = getReadOnlyEvm(mainnetChain.rpcBaseURL);

  const { data, isLoading } = useTypedSWR(['evm-gas-balance', address, mainnetChain.rpcBaseURL], () =>
    viemClient.getBalance({ address })
  );

  const balanceStr = useMemo(() => {
    const valueStr = data ? atomsToTokens(String(data), currency.decimals).toFixed(6) : '0';

    return `${valueStr} ${currency.symbol}`;
  }, [data, currency]);

  return <div>{isLoading ? 'Loading...' : balanceStr}</div>;
};

interface AssetBannerProps {
  chainKind: string;
  chainId: string;
  assetSlug: string;
}

const AssetBanner = memo<AssetBannerProps>(({ chainKind, chainId, assetSlug }) =>
  chainKind === TempleChainKind.Tezos ? (
    <TezosAssetBanner chainId={chainId} assetSlug={assetSlug} />
  ) : (
    <EvmAssetBanner chainId={Number(chainId)} assetSlug={assetSlug} />
  )
);

interface EvmAssetBannerProps {
  chainId: number;
  assetSlug: string;
}

const EvmAssetBanner = memo<EvmAssetBannerProps>(({ chainId, assetSlug }) => {
  const accountEvmAddress = useAccountAddressForEvm();
  const network = useEvmChainByChainId(chainId);
  const metadata = useEvmTokenMetadata(chainId, assetSlug);
  const assetName = getAssetName(metadata);
  const assetSymbol = getAssetSymbol(metadata);

  if (!accountEvmAddress || !network || !metadata) return null;

  return (
    <div className="w-full max-w-sm mx-auto mb-4">
      <div className="flex justify-between items-center mb-3">
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
        <EvmBalance chainId={chainId} address={accountEvmAddress} assetSlug={assetSlug}>
          {balance => (
            <div className="flex flex-col">
              <div className="flex text-2xl">
                <Money smallFractionFont={false}>{balance}</Money>
                <span className="ml-1">{assetSymbol}</span>
              </div>

              <InFiat chainId={network.chainId} assetSlug={assetSlug} volume={balance} smallFractionFont={false}>
                {({ balance, symbol }) => (
                  <div style={{ lineHeight: '19px' }} className="mt-1 text-base text-gray-500 flex">
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
    </div>
  );
});

const TezosAssetBanner = memo<Omit<AssetBannerProps, 'chainKind'>>(({ chainId, assetSlug }) => {
  const accountTezAddress = useAccountAddressForTezos();
  const network = useTezosChainByChainId(chainId);
  const metadata = useAssetMetadata(assetSlug, chainId);
  const assetName = getAssetName(metadata);
  const assetSymbol = getAssetSymbol(metadata);

  if (!accountTezAddress || !network || !metadata) return null;

  return (
    <div className="w-full max-w-sm mx-auto mb-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <AssetIcon tezosChainId={chainId} assetSlug={assetSlug} size={24} className="flex-shrink-0" />

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
                <Money smallFractionFont={false}>{balance}</Money>
                <span className="ml-1">{assetSymbol}</span>
              </div>

              <InFiat chainId={network.chainId} assetSlug={assetSlug} volume={balance} smallFractionFont={false}>
                {({ balance, symbol }) => (
                  <div style={{ lineHeight: '19px' }} className="mt-1 text-base text-gray-500 flex">
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
    </div>
  );
});
