import React, { FC, useCallback, useMemo } from 'react';

import classNames from 'clsx';

import Money from 'app/atoms/Money';
import { AssetIcon } from 'app/templates/AssetIcon';
import Balance from 'app/templates/Balance';
import IconifiedSelect, { IconifiedSelectOptionRenderProps } from 'app/templates/IconifiedSelect';
import InFiat from 'app/templates/InFiat';
import { T } from 'lib/i18n/react';
import { useAccount, useAssetMetadata } from 'lib/temple/front';
import { getAssetName, getAssetSymbol } from 'lib/temple/metadata/utils';

import { IAsset } from './interfaces';
import { getSlug } from './utils';

type AssetSelectProps = {
  value: IAsset;
  assets: IAsset[];
  onChange?: (assetSlug: string) => void;
  className?: string;
};

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
      Icon={OptionIcon}
      OptionSelectedIcon={OptionSelectedIcon}
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

const OptionIcon: FC<AssetSelectOptionRenderProps> = ({ option }) => (
  <AssetIcon assetSlug={getSlug(option)} className="h-8 w-auto mr-3" size={32} />
);

const OptionSelectedIcon: FC<AssetSelectOptionRenderProps> = ({ option }) => (
  <AssetIcon assetSlug={getSlug(option)} className="h-12 w-auto mr-3" size={48} />
);

const AssetInMenuContent: FC<AssetSelectOptionRenderProps> = ({ option: asset }) => {
  const account = useAccount();
  const assetSlug = getSlug(asset);
  const metadata = useAssetMetadata(assetSlug);

  return (
    <div className="flex flex-col items-start">
      <span className="text-gray-700 text-sm">{getAssetName(metadata)}</span>
      <span className={classNames('text-gray-600', 'text-sm leading-none flex items-baseline')}>
        <Balance assetSlug={assetSlug} address={account.publicKeyHash}>
          {balance => (
            <>
              <Money>{balance}</Money>
              <span className="text-gray-500 ml-1" style={{ fontSize: '0.75em' }}>
                {getAssetSymbol(metadata)}
              </span>
            </>
          )}
        </Balance>
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
          <span className="text-xl text-gray-800 flex items-baseline">
            <Money smallFractionFont={false}>{balance}</Money>{' '}
            <span className="ml-2" style={{ fontSize: '0.75em' }}>
              {getAssetSymbol(metadata)}
            </span>
          </span>

          <InFiat smallFractionFont={false} assetSlug={assetSlug} volume={balance}>
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
  );
};
