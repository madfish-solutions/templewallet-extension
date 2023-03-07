import React, { useMemo, useCallback, FC } from 'react';

import classNames from 'clsx';
import browser from 'webextension-polyfill';

import Flag from 'app/atoms/Flag';
import { T, t } from 'lib/i18n';
import { BlockExplorer, useChainId, BLOCK_EXPLORERS, useBlockExplorer } from 'lib/temple/front';
import { isKnownChainId } from 'lib/temple/types';
import { searchAndFilterItems } from 'lib/utils/search-items';

import IconifiedSelect, { IconifiedSelectOptionRenderProps } from './IconifiedSelect';

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

  const title = useMemo(
    () => (
      <h2 className={classNames('mb-4', 'leading-tight', 'flex flex-col')}>
        <span className="text-base font-semibold text-gray-700">
          <T id="blockExplorer" />
        </span>
      </h2>
    ),
    []
  );

  const handleBlockExplorerChange = useCallback(
    (option: BlockExplorer) => {
      setExplorerId(option.id);
    },
    [setExplorerId]
  );

  return (
    <IconifiedSelect
      Icon={BlockExplorerIcon}
      OptionSelectedIcon={BlockExplorerIcon}
      OptionInMenuContent={BlockExplorerInMenuContent}
      OptionSelectedContent={BlockExplorerSelectContent}
      getKey={getBlockExplorerId}
      onChange={handleBlockExplorerChange}
      options={options}
      value={explorer}
      noItemsText={t('noItemsFound')}
      title={title}
      className={className}
      padded
      fieldStyle={{ minHeight: '3.375rem' }}
      search={{ filterItems: searchItems }}
    />
  );
};

export default BlockExplorerSelect;

const BlockExplorerIcon: FC<IconifiedSelectOptionRenderProps<BlockExplorer>> = ({ option: { id, name } }) => (
  <Flag alt={name} className="ml-2 mr-3" src={browser.runtime.getURL(`/misc/explorer-logos/${id}.ico`)} />
);

const BlockExplorerInMenuContent: FC<IconifiedSelectOptionRenderProps<BlockExplorer>> = ({ option: { name } }) => (
  <div className={classNames('relative w-full text-lg text-gray-700')}>{name}</div>
);

const BlockExplorerSelectContent: FC<IconifiedSelectOptionRenderProps<BlockExplorer>> = ({ option }) => (
  <div className="flex flex-col items-start py-2">
    <span className="text-xl text-gray-700">{option.name}</span>
  </div>
);

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
