import React, { useMemo, useCallback, FC } from 'react';

import browser from 'webextension-polyfill';

import Flag from 'app/atoms/Flag';
import { setTestID } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { BlockExplorer, useChainId, BLOCK_EXPLORERS, useBlockExplorer } from 'lib/temple/front';
import { isKnownChainId } from 'lib/temple/types';
import { searchAndFilterItems } from 'lib/utils/search-items';

import IconifiedSelect, { IconifiedSelectOptionRenderProps } from '../../IconifiedSelect';
import { SettingsGeneralSelectors } from '../SettingsGeneral.selectors';

type BlockExplorerSelectProps = {
  className?: string;
};

const getBlockExplorerId = ({ id }: BlockExplorer) => id;

const BlockExplorerSelect: FC<BlockExplorerSelectProps> = ({ className }) => {
  const { explorer, setExplorerId } = useBlockExplorer();
  const chainId = useChainId(true)!;

  const options = useMemo(() => {
    if (chainId && isKnownChainId(chainId)) {
      return BLOCK_EXPLORERS.filter(explorer => explorer.baseUrls.get(chainId));
    }

    return [];
  }, [chainId]);

  const searchItems = useCallback((searchString: string) => searchBlockExplorer(searchString, options), [options]);

  const handleBlockExplorerChange = useCallback(
    (option: BlockExplorer) => {
      setExplorerId(option.id);
    },
    [setExplorerId]
  );

  return (
    <IconifiedSelect
      BeforeContent={BlockExplorerTitle}
      FieldContent={BlockExplorerFieldContent}
      OptionContent={BlockExplorerOptionContent}
      getKey={getBlockExplorerId}
      onChange={handleBlockExplorerChange}
      options={options}
      value={explorer}
      noItemsText={t('noItemsFound')}
      className={className}
      padded
      fieldStyle={{ minHeight: '3.375rem' }}
      search={{ filterItems: searchItems }}
      testID={SettingsGeneralSelectors.blockExplorerDropDown}
    />
  );
};

export default BlockExplorerSelect;

const BlockExplorerTitle: FC = () => (
  <h2 className="mb-4 leading-tight flex flex-col">
    <span className="text-base font-semibold text-gray-700">
      <T id="blockExplorer" />
    </span>
  </h2>
);

const BlockExplorerIcon: FC<IconifiedSelectOptionRenderProps<BlockExplorer>> = ({ option: { id, name } }) => (
  <Flag alt={name} className="ml-2 mr-3" src={browser.runtime.getURL(`/misc/explorer-logos/${id}.ico`)} />
);

const BlockExplorerFieldContent: FC<IconifiedSelectOptionRenderProps<BlockExplorer>> = ({ option }) => {
  return (
    <>
      <BlockExplorerIcon option={option} />

      <span className="text-xl text-gray-700">{option.name}</span>
    </>
  );
};

const BlockExplorerOptionContent: FC<IconifiedSelectOptionRenderProps<BlockExplorer>> = ({ option }) => {
  return (
    <>
      <BlockExplorerIcon option={option} />

      <div className="w-full text-lg text-gray-700" {...setTestID(SettingsGeneralSelectors.blockExplorerItem)}>
        {option.name}
      </div>
    </>
  );
};

const searchBlockExplorer = (searchString: string, options: BlockExplorer[]) =>
  searchAndFilterItems(
    options,
    searchString,
    [
      { name: 'name', weight: 1 },
      { name: 'urls', weight: 0.25 }
    ],
    ({ name, baseUrls }) => ({
      name,
      urls: Array.from(baseUrls.values()).map(item => item.transaction)
    })
  );
