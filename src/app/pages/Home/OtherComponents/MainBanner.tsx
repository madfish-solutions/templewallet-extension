import React, { memo, FC, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import { useDispatch } from 'react-redux';

import { Button } from 'app/atoms';
import Money from 'app/atoms/Money';
import { toggleBalanceModeAction } from 'app/store/settings/actions';
import { useBalanceModeSelector } from 'app/store/settings/selectors';
import { BalanceMode } from 'app/store/settings/state';
import { AssetIcon } from 'app/templates/AssetIcon';
import Balance from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { useFiatCurrency } from 'lib/fiat-currency';
import { t, T } from 'lib/i18n';
import { TezosLogoIcon } from 'lib/icons';
import { getAssetName, getAssetSymbol, useAssetMetadata } from 'lib/metadata';
import { useGasToken, useNetwork } from 'lib/temple/front';
import { useTotalBalance } from 'lib/temple/front/use-total-balance.hook';
import useTippy from 'lib/ui/useTippy';

import { HomeSelectors } from '../Home.selectors';
import AddressChip from './AddressChip';

interface Props {
  assetSlug?: string | null;
  accountPkh: string;
}

const MainBanner = memo<Props>(({ assetSlug, accountPkh }) => {
  return assetSlug ? (
    <AssetBanner assetSlug={assetSlug ?? 'tez'} accountPkh={accountPkh} />
  ) : (
    <TotalVolumeBanner accountPkh={accountPkh} />
  );
});

export default MainBanner;

interface TotalVolumeBannerProps {
  accountPkh: string;
}

const TotalVolumeBanner: FC<TotalVolumeBannerProps> = ({ accountPkh }) => (
  <div className="flex items-start justify-between w-full max-w-sm mx-auto mb-4">
    <BalanceInfo />
    <AddressChip pkh={accountPkh} testID={HomeSelectors.publicAddressButton} />
  </div>
);

const BalanceInfo: FC = () => {
  const dispatch = useDispatch();
  const network = useNetwork();
  const { totalBalanceInFiat, totalBalanceInGasToken } = useTotalBalance();
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
    []
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
            className={classNames(
              'mr-1',
              'p-1',
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

        <div className="text-sm font-medium text-gray-700">
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
          <BalanceFiat volume={totalBalanceInFiat} currency={fiatSymbol} />
        ) : (
          <BalanceGas volume={totalBalanceInGasToken} currency={gasTokenSymbol} />
        )}
      </div>
    </div>
  );
};

interface BalanceProps {
  volume: number | string | BigNumber;
  currency: string;
}
const BalanceFiat: FC<BalanceProps> = ({ volume, currency }) => (
  <>
    <span className="mr-1">≈</span>
    <Money smallFractionFont={false} fiat>
      {volume}
    </Money>
    <span className="ml-1">{currency}</span>
  </>
);

const BalanceGas: FC<BalanceProps> = ({ volume, currency }) => (
  <>
    <Money smallFractionFont={false}>{volume}</Money>
    <span className="ml-1">{currency}</span>
  </>
);

interface AssetBannerProps {
  assetSlug: string;
  accountPkh: string;
}

const AssetBanner: FC<AssetBannerProps> = ({ assetSlug, accountPkh }) => {
  const assetMetadata = useAssetMetadata(assetSlug);

  return (
    <div className="w-full max-w-sm mx-auto mb-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <AssetIcon assetSlug={assetSlug} size={24} className="flex-shrink-0" />
          <div className="text-sm font-normal text-gray-700 truncate flex-1 ml-2">{getAssetName(assetMetadata)}</div>
        </div>
        <AddressChip pkh={accountPkh} />
      </div>
      <div className="flex items-center text-2xl">
        <Balance address={accountPkh} assetSlug={assetSlug}>
          {balance => (
            <div style={{ lineHeight: '29px' }} className="flex flex-col">
              <div className="flex font-medium">
                <Money smallFractionFont={false} fiat>
                  {balance}
                </Money>
                <span className="ml-2">{getAssetSymbol(assetMetadata)}</span>
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
};
