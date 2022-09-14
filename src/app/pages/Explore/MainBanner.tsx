import React, { memo, FC, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import Money from 'app/atoms/Money';
import { AssetIcon } from 'app/templates/AssetIcon';
import Balance from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { useAssetFiatCurrencyPrice, useFiatCurrency } from 'lib/fiat-curency';
import { T } from 'lib/i18n/react';
import {
  getAssetName,
  getAssetSymbol,
  useAssetMetadata,
  useChainId,
  useDisplayedFungibleTokens,
  useBalance
} from 'lib/temple/front';

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
  const tezPrice = useAssetFiatCurrencyPrice('tez');
  const { selectedFiatCurrency } = useFiatCurrency();

  const volumeInUSD = useMemo(() => {
    if (tokens && tezBalance && tezPrice) {
      const tezBalanceInUSD = tezBalance.times(tezPrice);
      const tokensBalanceInUSD = tokens.reduce((sum, t) => sum.plus(t.latestUSDBalance ?? 0), new BigNumber(0));

      return tezBalanceInUSD.plus(tokensBalanceInUSD);
    }

    return null;
  }, [tokens, tezBalance, tezPrice]);

  return (
    <div className="w-full max-w-sm mx-auto mb-4">
      <div className="flex justify-between items-center mb-3">
        {volumeInUSD && (
          <div className="text-sm font-medium text-gray-700">
            <T id="totalEquityValue" />
          </div>
        )}
        <AddressChip pkh={accountPkh} />
      </div>
      <div className="flex items-center text-2xl">
        <span className="mr-1">≈</span>
        <Money smallFractionFont={false} fiat>
          {volumeInUSD}
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
