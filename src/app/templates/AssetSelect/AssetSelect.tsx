import React, { FC, useCallback } from 'react';

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
import { SendFormSelectors } from '../SendForm/selectors';
import { IAsset } from './interfaces';
import { getSlug } from './utils';

interface AssetSelectProps {
  value: IAsset;
  assets: IAsset[];
  onChange?: (assetSlug: string) => void;
  className?: string;
  testIDs?: {
    main: string;
    searchInput: string;
  };
}

const AssetSelect: FC<AssetSelectProps> = ({ value, assets, onChange, className, testIDs }) => {
  const allTokensBaseMetadata = useAllTokensBaseMetadata();

  const searchItems = useCallback(
    (searchString: string) => searchAssetsWithNoMeta(searchString, assets, allTokensBaseMetadata, getSlug),
    [assets]
  );

  const handleChange = useCallback(
    (asset: IAsset) => {
      onChange?.(getSlug(asset));
    },
    [onChange]
  );

  return (
    <IconifiedSelect
      BeforeContent={AssetSelectTitle}
      FieldContent={AssetFieldContent}
      OptionContent={AssetOptionContent}
      getKey={getSlug}
      onChange={handleChange}
      options={assets}
      value={value}
      noItemsText={t('noAssetsFound')}
      className={className}
      fieldStyle={{ minHeight: '4.5rem' }}
      search={{
        placeholder: t('swapTokenSearchInputPlaceholder'),
        filterItems: searchItems,
        inputTestID: testIDs?.searchInput
      }}
      testID={testIDs?.main}
    />
  );
};

export default AssetSelect;

const AssetSelectTitle: FC = () => (
  <h2 className="mb-4 leading-tight flex flex-col">
    <span className="text-base font-semibold text-gray-700">
      <T id="asset" />
    </span>

    <span className="mt-1 text-xs font-light text-gray-600" style={{ maxWidth: '90%' }}>
      <T id="selectAnotherAssetPrompt" />
    </span>
  </h2>
);

type AssetSelectOptionRenderProps = IconifiedSelectOptionRenderProps<IAsset>;

const AssetFieldContent: FC<AssetSelectOptionRenderProps> = ({ option }) => {
  const account = useAccount();
  const assetSlug = getSlug(option);
  const metadata = useAssetMetadata(assetSlug);

  return (
    <>
      <AssetIcon assetSlug={assetSlug} className="mr-3" size={48} />

      <Balance assetSlug={assetSlug} address={account.publicKeyHash}>
        {balance => (
          <div className="flex flex-col items-start leading-none">
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
    </>
  );
};

const AssetOptionContent: FC<AssetSelectOptionRenderProps> = ({ option }) => {
  const slug = getSlug(option);

  return (
    <div className="flex items-center w-full py-1.5">
      <AssetIcon assetSlug={slug} className="mx-2" size={32} />

      <AssetItemContent slug={slug} nameTestID={SendFormSelectors.assetName} />
    </div>
  );
};
