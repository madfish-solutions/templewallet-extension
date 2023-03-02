import React, { FC, useCallback, useMemo } from 'react';

import Money from 'app/atoms/Money';
import { AssetIcon } from 'app/templates/AssetIcon';
import Balance from 'app/templates/Balance';
import IconifiedSelect, { IconifiedSelectOptionRenderProps } from 'app/templates/IconifiedSelect';
import InFiat from 'app/templates/InFiat';
import { T, t } from 'lib/i18n';
import { useAccount, useAssetMetadata } from 'lib/temple/front';
import { searchAssetsWithNoMeta, useAllTokensBaseMetadata } from 'lib/temple/front/assets';
import { getAssetSymbol } from 'lib/temple/metadata';

import { AssetItemContent } from '../AssetItemContent';
import { IAsset } from './interfaces';
import { getSlug } from './utils';

type AssetSelectProps = {
  value: IAsset;
  assets: IAsset[];
  onChange?: (assetSlug: string) => void;
  className?: string;
};

const AssetSelect: FC<AssetSelectProps> = ({ value, assets, onChange, className }) => {
  const allTokensBaseMetadata = useAllTokensBaseMetadata();

  const searchItems = useCallback(
    (searchString: string) => searchAssetsWithNoMeta(searchString, assets, allTokensBaseMetadata, getSlug),
    [assets]
  );

  const title = useMemo(
    () => (
      <h2 className="mb-4 leading-tight flex flex-col">
        <span className="text-base font-semibold text-gray-700">
          <T id="asset" />
        </span>

        <span className="mt-1 text-xs font-light text-gray-600" style={{ maxWidth: '90%' }}>
          <T id="selectAnotherAssetPrompt" />
        </span>
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
      fieldStyle={{ minHeight: '4.5rem' }}
      search={{
        placeholder: t('swapTokenSearchInputPlaceholder'),
        filterItems: searchItems
      }}
    />
  );
};

export default AssetSelect;

type AssetSelectOptionRenderProps = IconifiedSelectOptionRenderProps<IAsset>;

const OptionIcon: FC<AssetSelectOptionRenderProps> = ({ option }) => (
  <AssetIcon assetSlug={getSlug(option)} className="mr-2" size={32} />
);

const OptionSelectedIcon: FC<AssetSelectOptionRenderProps> = ({ option }) => (
  <AssetIcon assetSlug={getSlug(option)} className="mr-2" size={48} />
);

const AssetInMenuContent: FC<AssetSelectOptionRenderProps> = ({ option: asset }) => (
  <AssetItemContent slug={getSlug(asset)} />
);

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
