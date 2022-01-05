import React, { FC, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import Money from 'app/atoms/Money';
import GenericAssetIcon from 'app/templates/AssetIcon';
import Balance from 'app/templates/Balance';
import IconifiedSelect, { IconifiedSelectOptionRenderProps } from 'app/templates/IconifiedSelect';
import InUSD from 'app/templates/InUSD';
import { T } from 'lib/i18n/react';
import { AssetMetadata, getAssetName, getAssetSymbol, useAccount, useAssetMetadata } from 'lib/temple/front';
import { IAccountToken, getSlug } from 'lib/temple/repo';

type AssetSelectProps = {
  value: IAsset;
  assets: IAsset[];
  onChange?: (assetSlug: string) => void;
  className?: string;
};

export type IAsset = IAccountToken | 'tez';

const AssetSelect: FC<AssetSelectProps> = ({ value, assets, onChange, className }) => {
  const title = useMemo(
    () => (
      <h2 className={classNames('mb-4', 'leading-tight', 'flex flex-col')}>
        <T id="asset">{message => <span className="text-base font-semibold text-gray-700">{message}</span>}</T>

        <T id="selectAnotherAssetPrompt">
          {message => (
            <span className={classNames('mt-1', 'text-xs font-light text-gray-600')} style={{ maxWidth: '90%' }}>
              {message}
            </span>
          )}
        </T>
      </h2>
    ),
    []
  );

  const handleChange = useCallback(
    (asset: IAsset) => {
      onChange?.(getSlug(asset));
    },
    [onChange]
  );

  return (
    <IconifiedSelect
      Icon={AssetIcon}
      OptionSelectedIcon={AssetSelectedIcon}
      OptionInMenuContent={AssetInMenuContent}
      OptionSelectedContent={AssetSelectedContent}
      getKey={getSlug}
      options={assets}
      value={value}
      onChange={handleChange}
      title={title}
      className={className}
    />
  );
};

export default AssetSelect;

type AssetSelectOptionRenderProps = IconifiedSelectOptionRenderProps<IAsset>;

const AssetIcon: FC<AssetSelectOptionRenderProps> = ({ option }) => (
  <GenericAssetIcon assetSlug={getSlug(option)} className="h-8 w-auto mr-3" size={32} />
);

const AssetSelectedIcon: FC<AssetSelectOptionRenderProps> = ({ option }) => (
  <GenericAssetIcon assetSlug={getSlug(option)} className="h-12 w-auto mr-3" size={48} />
);

const AssetInMenuContent: FC<AssetSelectOptionRenderProps> = ({ option: asset }) => {
  const account = useAccount();
  const assetSlug = getSlug(asset);
  const metadata = useAssetMetadata(assetSlug);

  return (
    <div className="flex flex-col items-start">
      <span className="text-gray-700 text-sm">{getAssetName(metadata)}</span>

      <span className={classNames('text-gray-600', 'text-sm leading-none')}>
        {asset === 'tez' ? (
          <Balance assetSlug={assetSlug} address={account.publicKeyHash}>
            {balance => (
              <>
                <Money>{balance}</Money>{' '}
                <span className="text-gray-500" style={{ fontSize: '0.75em' }}>
                  {getAssetSymbol(metadata)}
                </span>
              </>
            )}
          </Balance>
        ) : (
          <AssetMoney asset={asset} metadata={metadata} />
        )}
      </span>
    </div>
  );
};

const AssetSelectedContent: FC<AssetSelectOptionRenderProps> = ({ option }) => {
  const account = useAccount();
  const assetSlug = getSlug(option);
  const metadata = useAssetMetadata(assetSlug);

  return (
    <Balance assetSlug={assetSlug} address={account.publicKeyHash}>
      {balance => (
        <div className="flex flex-col items-start">
          <span className="text-xl text-gray-800">
            <Money smallFractionFont={false}>{balance}</Money>{' '}
            <span style={{ fontSize: '0.75em' }}>{getAssetSymbol(metadata)}</span>
          </span>

          <InUSD smallFractionFont={false} assetSlug={assetSlug} volume={balance}>
            {usdBalance => <div className="mt-1 text-sm text-gray-500">≈ {usdBalance} $</div>}
          </InUSD>
        </div>
      )}
    </Balance>
  );
};

const AssetMoney: FC<{ asset: IAsset; metadata: AssetMetadata }> = ({ asset, metadata }) =>
  asset !== 'tez' && asset?.latestBalance && metadata ? (
    <>
      <Money tooltip={false}>{new BigNumber(asset.latestBalance).div(10 ** metadata.decimals)}</Money>{' '}
      <span className="text-gray-500" style={{ fontSize: '0.75em' }}>
        {getAssetSymbol(metadata)}
      </span>
    </>
  ) : null;
