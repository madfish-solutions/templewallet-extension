import React, { memo, FC } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import Money from 'app/atoms/Money';
import { AssetIcon } from 'app/templates/AssetIcon';
import Balance from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { useFiatCurrency } from 'lib/fiat-currency';
import { T } from 'lib/i18n';
import { TEZ_TOKEN_SLUG, useAssetMetadata, useBalance, useGasToken, useNetwork } from 'lib/temple/front';
import { useTotalBalance } from 'lib/temple/front/use-total-balance.hook';
import { getAssetName, getAssetSymbol } from 'lib/temple/metadata';

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

const TotalVolumeBanner: FC<TotalVolumeBannerProps> = ({ accountPkh }) => {
  const network = useNetwork();

  if (network.type === 'main') return <TotalVolumeBannerInFiat accountPkh={accountPkh} />;

  return <TotalVolumeBannerInGasToken accountPkh={accountPkh} />;
};

const TotalVolumeBannerInFiat: FC<TotalVolumeBannerProps> = ({ accountPkh }) => {
  const { selectedFiatCurrency } = useFiatCurrency();

  const volumeInFiat = useTotalBalance();

  return (
    <TotalVolumeBannerBase
      accountPkh={accountPkh}
      titleNode={<T id="totalEquityValue" />}
      balanceNode={
        <>
          <span className="mr-1">≈</span>
          <Money smallFractionFont={false} fiat>
            {volumeInFiat}
          </Money>
          <span className="ml-1">{selectedFiatCurrency.symbol}</span>
        </>
      }
    />
  );
};

const TotalVolumeBannerInGasToken: FC<TotalVolumeBannerProps> = ({ accountPkh }) => {
  const { name, symbol } = useGasToken().metadata;

  const { data: balance } = useBalance(TEZ_TOKEN_SLUG, accountPkh);
  const volume = balance || new BigNumber(0);

  return (
    <TotalVolumeBannerBase
      accountPkh={accountPkh}
      titleNode={
        <>
          {name} <T id="balance" />
        </>
      }
      balanceNode={
        <>
          <Money smallFractionFont={false}>{volume}</Money>
          <span className="ml-1">{symbol}</span>
        </>
      }
    />
  );
};

interface TotalVolumeBannerBaseProps {
  accountPkh: string;
  titleNode: React.ReactNode;
  balanceNode: React.ReactNode;
}

const TotalVolumeBannerBase: FC<TotalVolumeBannerBaseProps> = ({ accountPkh, titleNode, balanceNode }) => (
  <div className="w-full max-w-sm mx-auto mb-4">
    <div className="flex justify-between items-center mb-2">
      <div className="text-sm font-medium text-gray-700">{titleNode}</div>

      <AddressChip pkh={accountPkh} />
    </div>
    <div className="flex items-center text-2xl">{balanceNode}</div>
  </div>
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
