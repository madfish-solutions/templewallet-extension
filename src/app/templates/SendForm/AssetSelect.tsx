import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import classNames from 'clsx';
import { useDebounce } from 'use-debounce';

import Money from 'app/atoms/Money';
import { AssetIcon } from 'app/templates/AssetIcon';
import Balance from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { setTestID, setAnotherSelector, TestIDProperty } from 'lib/analytics';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { T, t } from 'lib/i18n';
import { useAssetMetadata, getAssetSymbol, useGetAssetMetadata } from 'lib/metadata';
import { TezosNetworkEssentials } from 'temple/networks';

import { AssetItemContent } from '../AssetItemContent';
import { DropdownSelect } from '../DropdownSelect/DropdownSelect';
import { InputContainer } from '../InputContainer/InputContainer';

import { SendFormSelectors } from './selectors';

interface Props {
  network: TezosNetworkEssentials;
  accountPkh: string;
  value: string;
  slugs: string[];
  onChange?: (assetSlug: string) => void;
  className?: string;
  testIDs?: {
    main: string;
    select: string;
    searchInput: string;
  };
}

const AssetSelect = memo<Props>(({ network, accountPkh, value, slugs, onChange, className, testIDs }) => {
  const getAssetMetadata = useGetAssetMetadata(network.chainId);

  const [searchString, setSearchString] = useState<string>('');
  const [searchStringDebounced] = useDebounce(searchString, 300);

  const searchItems = useCallback(
    (searchString: string) => searchAssetsWithNoMeta(searchString, slugs, getAssetMetadata, s => s),
    [slugs, getAssetMetadata]
  );

  const searchedOptions = useMemo(
    () => (searchStringDebounced ? searchItems(searchStringDebounced) : slugs),
    [searchItems, searchStringDebounced, slugs]
  );

  const handleChange = useCallback(
    (slug: string) => {
      onChange?.(slug);
    },
    [onChange]
  );

  const renderOptionContent = useCallback(
    (slug: string, selected: boolean) => (
      <AssetOptionContent network={network} accountPkh={accountPkh} slug={slug} selected={selected} />
    ),
    [network, accountPkh]
  );

  return (
    <InputContainer className={className} header={<AssetSelectTitle />}>
      <DropdownSelect
        DropdownFaceContent={
          <AssetFieldContent network={network} slug={value} publicKeyHash={accountPkh} testID={testIDs?.select} />
        }
        searchProps={{
          testId: testIDs?.searchInput,
          searchValue: searchString,
          onSearchChange: event => setSearchString(event.target.value)
        }}
        testID={testIDs?.main}
        dropdownButtonClassName="p-2 h-18"
        optionsProps={{
          options: searchedOptions,
          noItemsText: t('noAssetsFound'),
          getKey: option => option,
          onOptionChange: handleChange,
          renderOptionContent: slug => renderOptionContent(slug, slug === value)
        }}
      />
    </InputContainer>
  );
});

export default AssetSelect;

const AssetSelectTitle: FC = () => (
  <h2 className="leading-tight flex flex-col">
    <span className="text-base font-semibold text-gray-700">
      <T id="asset" />
    </span>

    <span className="mt-1 text-xs font-light text-gray-600 max-w-9/10">
      <T id="selectAnotherAssetPrompt" />
    </span>
  </h2>
);

interface AssetFieldContentProps extends TestIDProperty {
  network: TezosNetworkEssentials;
  slug: string;
  publicKeyHash: string;
}

const AssetFieldContent = memo<AssetFieldContentProps>(({ network, slug, publicKeyHash, testID }) => {
  const metadata = useAssetMetadata(slug, network.chainId);

  return (
    <div className="flex items-center" {...setTestID(testID)} {...setAnotherSelector('slug', slug)}>
      <AssetIcon tezosChainId={network.chainId} assetSlug={slug} className="mr-3" size={48} />

      <Balance network={network} assetSlug={slug} address={publicKeyHash}>
        {balance => (
          <div className="flex flex-col items-start leading-none">
            <span className="text-xl text-gray-800 flex items-baseline">
              <Money smallFractionFont={false}>{balance}</Money>{' '}
              <span className="ml-2" style={{ fontSize: '0.75em' }}>
                {getAssetSymbol(metadata)}
              </span>
            </span>

            <InFiat chainId={network.chainId} smallFractionFont={false} assetSlug={slug} volume={balance}>
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
  );
});

interface AssetOptionContentProps {
  network: TezosNetworkEssentials;
  accountPkh: string;
  slug: string;
  selected: boolean;
}

const AssetOptionContent = memo<AssetOptionContentProps>(({ network, accountPkh, slug, selected }) => (
  <div
    className={classNames('flex items-center w-full py-1.5 px-2 h-15', selected ? 'bg-gray-200' : 'hover:bg-gray-100')}
    {...setTestID(SendFormSelectors.assetDropDownItem)}
    {...setAnotherSelector('slug', slug)}
  >
    <AssetIcon tezosChainId={network.chainId} assetSlug={slug} className="mx-2" size={32} />

    <AssetItemContent network={network} slug={slug} publicKeyHash={accountPkh} />
  </div>
));
