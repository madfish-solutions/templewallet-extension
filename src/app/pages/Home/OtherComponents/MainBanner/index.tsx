import React, { memo, FC, useMemo } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms';
import Money from 'app/atoms/Money';
import { useTotalBalance } from 'app/pages/Home/OtherComponents/MainBanner/use-total-balance';
import { dispatch } from 'app/store';
import { toggleBalanceModeAction } from 'app/store/settings/actions';
import { useBalanceModeSelector } from 'app/store/settings/selectors';
import { BalanceMode } from 'app/store/settings/state';
import AddressChip from 'app/templates/AddressChip';
import { AssetIcon } from 'app/templates/AssetIcon';
import Balance from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { useGasToken } from 'lib/assets/hooks';
import { useFiatCurrency } from 'lib/fiat-currency';
import { t, T } from 'lib/i18n';
import { TezosLogoIcon } from 'lib/icons';
import { getAssetName, getAssetSymbol, useAssetMetadata } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import { atomsToTokens } from 'lib/temple/helpers';
import useTippy from 'lib/ui/useTippy';
import { getReadOnlyEvm } from 'temple/evm';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { useAccountAddressForEvm, useAccountAddressForTezos, useTezosNetwork, useEvmNetwork } from 'temple/front';

import { HomeSelectors } from '../../Home.selectors';
import { TokenPageSelectors } from '../TokenPage.selectors';

import { BalanceFiat } from './BalanceFiat';
import { BalanceGas } from './BalanceGas';

interface Props {
  assetSlug?: string | null;
}

const MainBanner = memo<Props>(({ assetSlug }) => {
  return assetSlug ? <AssetBanner assetSlug={assetSlug ?? 'tez'} /> : <TotalVolumeBanner />;
});

export default MainBanner;

const TotalVolumeBanner = () => {
  const tezosAddress = useAccountAddressForTezos();
  const evmAddress = useAccountAddressForEvm();

  return (
    <div className="flex items-start justify-between w-full max-w-sm mx-auto mb-4">
      {tezosAddress ? (
        <TezosBalanceInfo accountPkh={tezosAddress} />
      ) : evmAddress ? (
        <EvmBalanceInfo address={evmAddress} />
      ) : null}

      <div className="flex flex-col gap-y-1 items-end">
        {tezosAddress ? <AddressChip pkh={tezosAddress} testID={HomeSelectors.publicAddressButton} /> : null}
        {evmAddress ? <AddressChip pkh={evmAddress} /> : null}
      </div>
    </div>
  );
};

interface TezosBalanceInfoProps {
  accountPkh: string;
}

const TezosBalanceInfo: FC<TezosBalanceInfoProps> = ({ accountPkh }) => {
  const { isMainnet, chainId } = useTezosNetwork();
  const totalBalanceInDollar = useTotalBalance(accountPkh, chainId);
  const balanceMode = useBalanceModeSelector();

  const {
    selectedFiatCurrency: { name: fiatName, symbol: fiatSymbol }
  } = useFiatCurrency();

  const {
    metadata: { name: gasTokenName, symbol: gasTokenSymbol }
  } = useGasToken();

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
          <BalanceGas totalBalanceInDollar={totalBalanceInDollar} currency={gasTokenSymbol} accountPkh={accountPkh} />
        )}
      </div>
    </div>
  );
};

const EvmBalanceInfo: FC<{ address: HexString }> = ({ address }) => {
  const network = useEvmNetwork();
  const currency = network.currency;

  const viemClient = getReadOnlyEvm(network.rpcBaseURL);

  const { data, isLoading } = useTypedSWR(['evm-gas-balance', address, network.rpcBaseURL], () =>
    viemClient.getBalance({ address })
  );

  const balanceStr = useMemo(() => {
    const valueStr = data ? atomsToTokens(String(data), currency.decimals).toFixed(6) : '0';

    return `${valueStr} ${currency.symbol}`;
  }, [data, currency]);

  return <div>{isLoading ? 'Loading...' : balanceStr}</div>;
};

interface AssetBannerProps {
  assetSlug: string;
}

const AssetBanner = memo<AssetBannerProps>(({ assetSlug }) => {
  const accountTezAddress = useAccountAddressForTezos();

  return accountTezAddress ? (
    <TezosAssetBanner assetSlug={assetSlug} accountPkh={accountTezAddress} />
  ) : (
    <div className="w-full max-w-sm mx-auto mb-4">{UNDER_DEVELOPMENT_MSG}</div>
  );
});

interface TezosTezosAssetBanner extends AssetBannerProps {
  accountPkh: string;
}

const TezosAssetBanner = memo<TezosTezosAssetBanner>(({ accountPkh, assetSlug }) => {
  const assetMetadata = useAssetMetadata(assetSlug);
  const assetName = getAssetName(assetMetadata);
  const assetSymbol = getAssetSymbol(assetMetadata);

  return (
    <div className="w-full max-w-sm mx-auto mb-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <AssetIcon assetSlug={assetSlug} size={24} className="flex-shrink-0" />

          <div
            className="text-sm font-normal text-gray-700 truncate flex-1 ml-2"
            {...setTestID(TokenPageSelectors.tokenName)}
            {...setAnotherSelector('name', assetName)}
          >
            {assetName}
          </div>
        </div>

        <AddressChip pkh={accountPkh} modeSwitch={{ testID: HomeSelectors.addressModeSwitchButton }} />
      </div>

      <div className="flex items-center text-2xl">
        <Balance address={accountPkh} assetSlug={assetSlug}>
          {balance => (
            <div className="flex flex-col">
              <div className="flex text-2xl">
                <Money smallFractionFont={false} fiat>
                  {balance}
                </Money>
                <span className="ml-1">{assetSymbol}</span>
              </div>

              <InFiat assetSlug={assetSlug} volume={balance} smallFractionFont={false}>
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
    </div>
  );
});
