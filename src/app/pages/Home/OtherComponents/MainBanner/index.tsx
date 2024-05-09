import React, { memo, FC, useMemo } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms';
import Money from 'app/atoms/Money';
import { useTotalBalance } from 'app/hooks/use-total-balance';
import { ReactComponent as TezosLogoIcon } from 'app/icons/tezos-logo.svg';
import { dispatch } from 'app/store';
import { toggleBalanceModeAction } from 'app/store/settings/actions';
import { useBalanceModeSelector } from 'app/store/settings/selectors';
import { BalanceMode } from 'app/store/settings/state';
import AddressChip from 'app/templates/AddressChip';
import { AssetIcon } from 'app/templates/AssetIcon';
import Balance from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { useFiatCurrency } from 'lib/fiat-currency';
import { t, T } from 'lib/i18n';
import { getAssetName, getAssetSymbol, getTezosGasMetadata, useAssetMetadata } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import { atomsToTokens } from 'lib/temple/helpers';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import useTippy from 'lib/ui/useTippy';
import { getReadOnlyEvm } from 'temple/evm';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import {
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useEthereumMainnetChain,
  useTezosChainByChainId,
  useTezosMainnetChain
} from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';

import { HomeSelectors } from '../../Home.selectors';
import { TokenPageSelectors } from '../TokenPage.selectors';

import { BalanceFiat } from './BalanceFiat';
import { BalanceGas } from './BalanceGas';

interface Props {
  tezosChainId?: string | null;
  assetSlug?: string | null;
}

const MainBanner = memo<Props>(({ tezosChainId, assetSlug }) => {
  return tezosChainId && assetSlug ? (
    <AssetBanner tezosChainId={tezosChainId} assetSlug={assetSlug} />
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
    <div className="flex">
      {tezosAddress ? (
        <TezosBalanceInfo network={tezosMainnetChain} accountPkh={tezosAddress} />
      ) : evmAddress ? (
        <EvmBalanceInfo address={evmAddress} />
      ) : null}
    </div>
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
  tezosChainId: string;
  assetSlug: string;
}

const AssetBanner = memo<AssetBannerProps>(({ tezosChainId, assetSlug }) => {
  const accountTezAddress = useAccountAddressForTezos();
  const network = useTezosChainByChainId(tezosChainId);

  return network && accountTezAddress ? (
    <TezosAssetBanner network={network} assetSlug={assetSlug} accountPkh={accountTezAddress} />
  ) : (
    UNDER_DEVELOPMENT_MSG
  );
});

interface TezosTezosAssetBanner {
  network: TezosNetworkEssentials;
  accountPkh: string;
  assetSlug: string;
}

const TezosAssetBanner = memo<TezosTezosAssetBanner>(({ network, accountPkh, assetSlug }) => {
  const assetMetadata = useAssetMetadata(assetSlug, network.chainId);
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
          address={accountPkh}
          tezosNetwork={network}
          modeSwitchTestId={HomeSelectors.addressModeSwitchButton}
        />
      </div>

      <div className="flex items-center text-2xl">
        <Balance network={network} address={accountPkh} assetSlug={assetSlug}>
          {balance => (
            <div className="flex flex-col">
              <div className="flex text-2xl">
                <Money smallFractionFont={false} fiat>
                  {balance}
                </Money>
                <span className="ml-1">{assetSymbol}</span>
              </div>

              <InFiat tezosChainId={network.chainId} assetSlug={assetSlug} volume={balance} smallFractionFont={false}>
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
        </Balance>
      </div>
    </>
  );
});
