import React, { memo } from 'react';

import { IconButton } from 'app/atoms/IconButton';
import { SimpleSegmentControl } from 'app/atoms/SimpleSegmentControl';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { SearchBarField } from 'app/templates/SearchField';

import { NetworkSettingsSelectors } from './selectors';

interface FiltersBlockProps {
  searchValue: string;
  isTestnetTab: boolean;
  openMainnetTab: EmptyFn;
  openTestnetTab: EmptyFn;
  setSearchValue: SyncFn<string>;
  onAddNetworkClick: EmptyFn;
}

export const FiltersBlock = memo<FiltersBlockProps>(
  ({ searchValue, isTestnetTab, openMainnetTab, openTestnetTab, setSearchValue, onAddNetworkClick }) => {
    return (
      <div className="p-4 gap-4 flex flex-col bg-background">
        <SimpleSegmentControl
          className="w-full"
          firstTitle="Mainnet"
          secondTitle="Testnet"
          activeSecond={isTestnetTab}
          onFirstClick={openMainnetTab}
          onSecondClick={openTestnetTab}
          firstButtonTestId={NetworkSettingsSelectors.mainnetTabButton}
          secondButtonTestId={NetworkSettingsSelectors.testnetTabButton}
        />
        <div className="flex gap-2">
          <SearchBarField
            value={searchValue}
            onValueChange={setSearchValue}
            testID={NetworkSettingsSelectors.searchBarField}
          />

          <IconButton
            Icon={PlusIcon}
            color="blue"
            onClick={onAddNetworkClick}
            testID={NetworkSettingsSelectors.addNetworkButton}
          />
        </div>
      </div>
    );
  }
);
