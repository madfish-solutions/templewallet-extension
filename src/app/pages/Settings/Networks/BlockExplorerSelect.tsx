import React, { useMemo, useCallback, FC, useState, memo } from 'react';

import clsx from 'clsx';
import browser from 'webextension-polyfill';

import Flag from 'app/atoms/Flag';
import { DropdownSelect } from 'app/templates/DropdownSelect/DropdownSelect';
import { InputContainer } from 'app/templates/InputContainer/InputContainer';
import { T } from 'lib/i18n';
import { searchAndFilterItems } from 'lib/utils/search-items';
import { TezosBlockExplorer, useTezosBlockExplorersListingLogic } from 'temple/front/block-explorers';

// import { NetworksSettingsSelectors } from '../selectors';

interface Props {
  tezosChainId: string;
}

const BlockExplorerSelect = memo<Props>(({ tezosChainId }) => {
  const { knownOptions, currentKnownId, setExplorerById } = useTezosBlockExplorersListingLogic(tezosChainId);
  const [searchValue, setSearchValue] = useState<string>('');

  const currentOption = useMemo(
    () => (currentKnownId ? knownOptions.find(o => o.id === currentKnownId) : null),
    [knownOptions, currentKnownId]
  );

  const options = useMemo(() => searchBlockExplorer(searchValue, knownOptions), [knownOptions, searchValue]);

  const handleBlockExplorerChange = useCallback(
    (option: TezosBlockExplorer) => void setExplorerById(option.id),
    [setExplorerById]
  );

  return (
    <div>
      <InputContainer
        header={
          <span className="mb-1 text-md leading-tight">
            <T id="blockExplorer" />:
          </span>
        }
      >
        <DropdownSelect
          // testID={NetworksSettingsSelectors.blockExplorerDropDown}
          optionsListClassName="p-2"
          dropdownButtonClassName="p-3"
          DropdownFaceContent={currentOption ? <BlockExplorerFieldContent {...currentOption} /> : null}
          optionsProps={{
            options,
            noItemsText: 'No items',
            getKey: option => option.id,
            renderOptionContent: option => (
              <BlockExplorerOptionContent option={option} isSelected={option.id === currentKnownId} />
            ),
            onOptionChange: handleBlockExplorerChange
          }}
          searchProps={{
            searchValue,
            onSearchChange: event => setSearchValue(event?.target.value)
          }}
        />
      </InputContainer>
    </div>
  );
});

export default BlockExplorerSelect;

const BlockExplorerIcon: FC<Pick<TezosBlockExplorer, 'id' | 'name'>> = ({ id, name }) => (
  <Flag alt={name} className="ml-2 mr-3" src={browser.runtime.getURL(`/misc/explorer-logos/${id}.ico`)} />
);

const BlockExplorerFieldContent: FC<TezosBlockExplorer> = ({ id, name }) => (
  <div className="flex items-center">
    <BlockExplorerIcon id={id} name={name} />

    <span className="text-xl text-gray-700">{name}</span>
  </div>
);

interface BlockExplorerOptionContentProps {
  option: TezosBlockExplorer;
  isSelected?: boolean;
}

const BlockExplorerOptionContent: FC<BlockExplorerOptionContentProps> = ({ option, isSelected }) => {
  return (
    <div
      className={clsx('w-full flex items-center py-1.5 px-2 rounded', isSelected ? 'bg-gray-200' : 'hover:bg-gray-100')}
    >
      <BlockExplorerIcon id={option.id} name={option.name} />

      <div
        className="w-full text-left text-lg text-gray-700"
        // {...setTestID(NetworksSettingsSelectors.blockExplorerItem)}
      >
        {option.name}
      </div>
    </div>
  );
};

const searchBlockExplorer = (searchString: string, options: TezosBlockExplorer[]) =>
  searchAndFilterItems(options, searchString, [
    { name: 'name', weight: 1 },
    { name: 'baseUrl', weight: 0.25 }
  ]);
