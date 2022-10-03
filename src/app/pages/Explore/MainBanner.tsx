import React, { memo, FC, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import Money from 'app/atoms/Money';
import { AssetIcon } from 'app/templates/AssetIcon';
import Balance from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { useAssetFiatCurrencyPrice, useFiatCurrency } from 'lib/fiat-currency';
import { T } from 'lib/i18n/react';
import { useAssetMetadata, useChainId, useDisplayedFungibleTokens, useBalance } from 'lib/temple/front';
import { getAssetName, getAssetSymbol } from 'lib/temple/metadata';

import AddressChip from './AddressChip';

type MainBannerProps = {
  assetSlug?: string | null;
  accountPkh: string;
};

const MainBanner = memo<MainBannerProps>(({ assetSlug, accountPkh }) => {
  const chainId = useChainId(true)!;

  return assetSlug ? (
    <AssetBanner assetSlug={assetSlug ?? 'tez'} accountPkh={accountPkh} />
  ) : (
    <MainnetVolumeBanner chainId={chainId} accountPkh={accountPkh} />
  );
});

export default MainBanner;

type MainnetVolumeBannerProps = {
  chainId: string;
  accountPkh: string;
};

const MainnetVolumeBanner: FC<MainnetVolumeBannerProps> = ({ chainId, accountPkh }) => {
  const { data: tokens } = useDisplayedFungibleTokens(chainId, accountPkh);
  const { data: tezBalance } = useBalance('tez', accountPkh);

  const tezPriceInFiat = useAssetFiatCurrencyPrice('tez');
  const { fiatRates, selectedFiatCurrency } = useFiatCurrency();
  const safeFiatRates = fiatRates ?? {};
  const usdCurrency = safeFiatRates['usd'] ?? 1;
  const fiatToUsdRate = (safeFiatRates[selectedFiatCurrency.name.toLowerCase()] ?? 1) / usdCurrency;

  const volumeInFiat = useMemo<BigNumber>(() => {
    const initialVolume = new BigNumber(0);

    if (tokens && tezBalance && tezPriceInFiat) {
      const tezBalanceInFiat = tezBalance.times(tezPriceInFiat);
      const tokensBalanceInFiat = tokens
        .reduce((sum, t) => sum.plus(t.latestUSDBalance ?? 0), initialVolume)
        .times(fiatToUsdRate);

      return tezBalanceInFiat.plus(tokensBalanceInFiat);
    }

    return initialVolume;
  }, [tokens, tezBalance, tezPriceInFiat, fiatToUsdRate]);

  return (
    <div className="w-full max-w-sm mx-auto mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium text-gray-700">
          <T id="totalEquityValue" />
        </div>

        <AddressChip pkh={accountPkh} />
      </div>
      <div className="flex items-center text-2xl">
        <span className="mr-1">≈</span>
        <Money smallFractionFont={false} fiat>
          {volumeInFiat}
        </Money>
        <span className="mr-1">{selectedFiatCurrency.symbol}</span>
      </div>
    </div>
  );
};

type AssetBannerProps = {
  assetSlug: string;
  accountPkh: string;
};

const AssetBanner: FC<AssetBannerProps> = ({ assetSlug, accountPkh }) => {
  const assetMetadata = useAssetMetadata(assetSlug);

  return (
    <div className="w-full max-w-sm mx-auto mb-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <AssetIcon assetSlug={assetSlug} size={24} className="flex-shrink-0" />
          <div className={classNames('text-sm font-normal text-gray-700 truncate flex-1 ml-2')}>
            {getAssetName(assetMetadata)}
          </div>
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
