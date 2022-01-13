import React, { memo, FC, ReactNode, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import Money from 'app/atoms/Money';
import Name from 'app/atoms/Name';
import { useAppEnv } from 'app/env';
import { ReactComponent as DollarIcon } from 'app/icons/dollar.svg';
import { AssetIcon } from 'app/templates/AssetIcon';
import Balance from 'app/templates/Balance';
import InUSD from 'app/templates/InUSD';
import { T } from 'lib/i18n/react';
import {
  getAssetName,
  getAssetSymbol,
  useAssetMetadata,
  useChainId,
  useDisplayedFungibleTokens,
  useBalance,
  useAssetUSDPrice
} from 'lib/temple/front';

type MainBannerProps = {
  assetSlug?: string | null;
  accountPkh: string;
};

const MainBanner = memo<MainBannerProps>(({ assetSlug, accountPkh }) => {
  const chainId = useChainId(true)!;
  const assetBannerDisplayed = true; // assetSlug || !mainnet

  return assetBannerDisplayed ? (
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
  const tezPrice = useAssetUSDPrice('tez');

  const volumeInUSD = useMemo(() => {
    if (tokens && tezBalance && tezPrice) {
      const tezBalanceInUSD = tezBalance.times(tezPrice);
      const tokensBalanceInUSD = tokens.reduce((sum, t) => sum.plus(t.latestUSDBalance ?? 0), new BigNumber(0));

      return tezBalanceInUSD.plus(tokensBalanceInUSD);
    }

    return null;
  }, [tokens, tezBalance, tezPrice]);

  return (
    <BannerLayout name={<T id="totalBalance" />}>
      <div className="h-12 w-full flex items-stretch justify-center">
        {volumeInUSD && (
          <>
            <div className="flex-1 flex items-center justify-end">
              <DollarIcon
                className={classNames('flex-shrink-0', 'h-10 w-auto -mr-2', 'stroke-current text-gray-500')}
              />
            </div>

            <h3 className="text-3xl font-light text-gray-700 flex items-center">
              <Money fiat>{volumeInUSD}</Money>
            </h3>

            <div className="flex-1" />
          </>
        )}
      </div>
    </BannerLayout>
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
    <BannerLayout name={<Name style={{ maxWidth: popup ? '11rem' : '13rem' }}>{getAssetName(assetMetadata)}</Name>}>
      <AssetIcon assetSlug={assetSlug} size={48} className="mr-3 flex-shrink-0" />

      <div className="font-light leading-none">
        <div className="flex items-center">
          <Balance address={accountPkh} assetSlug={assetSlug}>
            {balance => (
              <div className="flex flex-col">
                <span className="text-xl text-gray-800">
                  <Money smallFractionFont={false}>{balance}</Money>{' '}
                  <span className="text-lg">{getAssetSymbol(assetMetadata)}</span>
                </span>

                <InUSD assetSlug={assetSlug} volume={balance} smallFractionFont={false}>
                  {usdBalance => <div className="mt-1 text-sm text-gray-500">≈ {usdBalance} $</div>}
                </InUSD>
              </div>
            )}
          </Balance>
        </div>
      </div>
    </BannerLayout>
  );
};

type BannerLayoutProps = {
  name: ReactNode;
};

const BannerLayout: FC<BannerLayoutProps> = ({ name, children }) => (
  <div className={classNames('w-full mx-auto', 'pt-1', 'flex flex-col items-center max-w-sm px-6')}>
    <div className={classNames('relative', 'w-full', 'border rounded-md', 'p-2', 'flex items-center')}>
      <div className={classNames('absolute top-0 left-0 right-0', 'flex justify-center')}>
        <div
          className={classNames(
            '-mt-3 py-1 px-2',
            'bg-white rounded-full',
            'text-sm font-light leading-none text-center',
            'text-gray-500'
          )}
        >
          {name}
        </div>
      </div>

      {children}
    </div>
  </div>
);
