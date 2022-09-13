import React, { memo, FC, ReactNode, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import Money from 'app/atoms/Money';
import Name from 'app/atoms/Name';
import { useAppEnv } from 'app/env';
import { AssetIcon } from 'app/templates/AssetIcon';
import Balance from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { useAssetFiatCurrencyPrice, useFiatCurrency } from 'lib/fiat-curency';
import { T } from 'lib/i18n/react';
import { PropsWithChildren } from 'lib/props-with-children';
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
  // const assetBannerDisplayed = true; // assetSlug || !mainnet

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
          <div className="text-sm font-medium color-darkgrey">
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
  const { popup } = useAppEnv();

  return (
    <div className="w-full max-w-sm mx-auto mb-4">
      <div className="flex items-center mb-3">
        <AssetIcon assetSlug={assetSlug} size={48} className="mr-3 flex-shrink-0" />
        <div className="ml-4">
          <div>{getAssetSymbol(assetMetadata)}</div>
          <div className={classNames('text-xs font-normal text-gray-700 truncate flex-1')}>
            {getAssetName(assetMetadata)}
          </div>
        </div>
      </div>
      <div className="font-light leading-none">
        <div className="flex items-center">
          <Balance address={accountPkh} assetSlug={assetSlug}>
            {balance => (
              <div className="flex flex-col">
                <span className="text-xl text-gray-800 flex items-baseline">
                  <span className="inline-block align-bottom" style={{ maxWidth: popup ? '8rem' : '10rem' }}>
                    <Money smallFractionFont={false}>{balance}</Money>
                  </span>{' '}
                  <span className="text-lg flex-2 ml-2">{getAssetSymbol(assetMetadata)}</span>
                </span>

                <InFiat assetSlug={assetSlug} volume={balance} smallFractionFont={false}>
                  {({ balance, symbol }) => (
                    <div className="mt-1 text-sm text-gray-500 flex">
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
    </div>
  );
};
