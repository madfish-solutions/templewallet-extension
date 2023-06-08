import React, { useMemo, useCallback, FC, useState } from 'react';

import classNames from 'clsx';
import browser from 'webextension-polyfill';

import Flag from 'app/atoms/Flag';
import { InputGeneral } from 'app/templates/InputGeneral/InputGeneral';
import { SelectGeneral } from 'app/templates/InputGeneral/SelectGeneral';
import { setTestID } from 'lib/analytics';
import { T } from 'lib/i18n';
import { BlockExplorer, useChainId, BLOCK_EXPLORERS, useBlockExplorer } from 'lib/temple/front';
import { isKnownChainId } from 'lib/temple/types';
import { searchAndFilterItems } from 'lib/utils/search-items';

import { IconifiedSelectOptionRenderProps } from '../../IconifiedSelect';
import { SettingsGeneralSelectors } from '../selectors';

type BlockExplorerSelectProps = {
  className?: string;
};

const renderOptionContent = (option: BlockExplorer, isSelected: boolean) => (
  <BlockExplorerOptionContent option={option} isSelected={isSelected} />
);

const BlockExplorerSelect: FC<BlockExplorerSelectProps> = () => {
  const { explorer, setExplorerId } = useBlockExplorer();
  const chainId = useChainId(true)!;
  const [searchValue, setSearchValue] = useState<string>('');

  const options = useMemo(() => {
    if (chainId && isKnownChainId(chainId)) {
      const knownExplorers = BLOCK_EXPLORERS.filter(explorer => explorer.baseUrls.get(chainId));

      return searchBlockExplorer(searchValue, knownExplorers);
    }

    return [];
  }, [chainId, searchValue]);

  const handleBlockExplorerChange = useCallback(
    (option: BlockExplorer) => {
      setExplorerId(option.id);
    },
    [setExplorerId]
  );

  return (
    <div className="mb-8">
      <InputGeneral
        header={<BlockExplorerTitle />}
        mainContent={
          <SelectGeneral
            testIds={{
              dropdownTestId: SettingsGeneralSelectors.blockExplorerDropDown
            }}
            optionsListClassName="p-2"
            dropdownButtonClassName="p-3"
            DropdownFaceContent={<BlockExplorerFieldContent option={explorer} />}
            optionsProps={{
              options,
              noItemsText: 'No items',
              renderOptionContent: option =>
                renderOptionContent(option, JSON.stringify(option) === JSON.stringify(explorer)),
              onOptionChange: handleBlockExplorerChange
            }}
            searchProps={{
              searchValue,
              onSearchChange: event => setSearchValue(event?.target.value)
            }}
          />
        }
      />
    </div>
  );
};

export default BlockExplorerSelect;

const BlockExplorerTitle: FC = () => (
  <h2 className="leading-tight flex flex-col">
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
    <div className="flex items-center">
      <BlockExplorerIcon option={option} />

      <span className="text-xl text-gray-700">{option.name}</span>
    </div>
  );
};

interface BlockExplorerOptionContentProps {
  option: BlockExplorer;
  isSelected?: boolean;
}

const BlockExplorerOptionContent: FC<BlockExplorerOptionContentProps> = ({ option, isSelected }) => {
  return (
    <div
      className={classNames(
        'w-full flex items-center py-1.5 px-2 rounded',
        isSelected ? 'bg-gray-200' : 'hover:bg-gray-100'
      )}
    >
      <BlockExplorerIcon option={option} />

      <div className="w-full text-lg text-gray-700" {...setTestID(SettingsGeneralSelectors.blockExplorerItem)}>
        {option.name}
      </div>
    </div>
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
