import React, { FC, useCallback, useMemo } from 'react';

import Money from 'app/atoms/Money';
import { AssetIcon } from 'app/templates/AssetIcon';
import Balance from 'app/templates/Balance';
import IconifiedSelect, { IconifiedSelectOptionRenderProps } from 'app/templates/IconifiedSelectWithSearch';
import InFiat from 'app/templates/InFiat';
import { T, t } from 'lib/i18n';
import { useAccount, useAssetMetadata } from 'lib/temple/front';
import { searchAssetsBySlugs, useAllTokensBaseMetadata } from 'lib/temple/front/assets';
import { getAssetName, getAssetSymbol } from 'lib/temple/metadata';

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
    (searchString: string) => {
      const searched = searchAssetsBySlugs(
        searchString,
        assets.map(item => getSlug(item)),
        allTokensBaseMetadata
      );

      return assets.filter(item => searched.some(slug => slug === getSlug(item)));
    },
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

const AssetInMenuContent: FC<AssetSelectOptionRenderProps> = ({ option: asset }) => {
  const { publicKeyHash } = useAccount();
  const assetSlug = getSlug(asset);
  const metadata = useAssetMetadata(assetSlug);

  return (
    <>
      <div className="flex flex-col items-start mr-2">
        <span className="text-gray-910 text-lg">{getAssetSymbol(metadata)}</span>
        <span className="text-gray-600 text-xs">{getAssetName(metadata)}</span>
      </div>
      <div className="flex-1 flex flex-col items-end">
        <span className="text-gray-910 text-lg">
          <Balance assetSlug={assetSlug} address={publicKeyHash}>
            {balance => <Money>{balance}</Money>}
          </Balance>
        </span>
        <span className="text-xs text-gray-600">
          <Balance assetSlug={assetSlug} address={publicKeyHash}>
            {volume => (
              <InFiat assetSlug={assetSlug} volume={volume} smallFractionFont={false}>
                {({ balance, symbol }) => (
                  <>
                    <span className="mr-1">≈</span>
                    {balance}
                    <span className="ml-1">{symbol}</span>
                  </>
                )}
              </InFiat>
            )}
          </Balance>
        </span>
      </div>
    </>
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
