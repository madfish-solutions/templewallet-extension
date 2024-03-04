import React, { memo, FC, useMemo } from 'react';

import clsx from 'clsx';
import { useDispatch } from 'react-redux';

import { Button } from 'app/atoms';
import Money from 'app/atoms/Money';
import { useTotalBalance } from 'app/pages/Home/OtherComponents/MainBanner/use-total-balance';
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
import { useNetwork } from 'lib/temple/front';
import useTippy from 'lib/ui/useTippy';

import { HomeSelectors } from '../../Home.selectors';
import { TokenPageSelectors } from '../TokenPage.selectors';

import { BalanceFiat } from './BalanceFiat';
import { BalanceGas } from './BalanceGas';

interface Props {
  assetSlug?: string | null;
  accountPkh: string;
}

const MainBanner: FC<Props> = ({ assetSlug, accountPkh }) => {
  return assetSlug ? (
    <AssetBanner assetSlug={assetSlug ?? 'tez'} accountPkh={accountPkh} />
  ) : (
    <TotalVolumeBanner accountPkh={accountPkh} />
  );
};

export default MainBanner;

interface TotalVolumeBannerProps {
  accountPkh: string;
}

const TotalVolumeBanner = memo<TotalVolumeBannerProps>(({ accountPkh }) => (
  <div className="flex items-start justify-between w-full max-w-sm mx-auto mb-4">
    <BalanceInfo accountPkh={accountPkh} />
    <AddressChip pkh={accountPkh} testID={HomeSelectors.publicAddressButton} />
  </div>
));

const BalanceInfo: FC<{ accountPkh: string }> = ({ accountPkh }) => {
  const dispatch = useDispatch();
  const network = useNetwork();
  const totalBalanceInDollar = useTotalBalance();
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

  const isMainNetwork = network.type === 'main';
  const isFiatMode = balanceMode === BalanceMode.Fiat;
  const shouldShowFiatBanner = isMainNetwork && isFiatMode;

  return (
    <div className="flex flex-col justify-between items-start">
      <div className="flex items-center">
        {isMainNetwork && (
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

interface AssetBannerProps {
  assetSlug: string;
  accountPkh: string;
}

const AssetBanner = memo<AssetBannerProps>(({ assetSlug, accountPkh }) => {
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
