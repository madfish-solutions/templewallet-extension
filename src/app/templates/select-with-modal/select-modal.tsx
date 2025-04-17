import React, { useMemo, useState } from 'react';

import clsx from 'clsx';

import { EmptyState } from 'app/atoms/EmptyState';
import { PageModal } from 'app/atoms/PageModal';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { SearchBarField } from 'app/templates/SearchField';
import { SearchKey, searchAndFilterItems } from 'lib/utils/search-items';

import { SelectModalOption, SelectModalOptionProps } from './select-modal-option';

export interface SelectModalProps<T, P extends null | SyncFn<T, any>>
  extends Pick<SelectModalOptionProps<T>, 'CellIcon' | 'CellName' | 'onSelect'> {
  title: string;
  opened: boolean;
  options: T[];
  value: T;
  searchKeys: SearchKey<T, P>[];
  searchThreshold?: number;
  searchPrepare?: P;
  keyFn: SyncFn<T, string | number>;
  onRequestClose: EmptyFn;
  itemTestID: string;
}

export const SelectModal = <T, P extends null | SyncFn<T, any>>({
  title,
  opened,
  options,
  value,
  searchKeys,
  searchThreshold,
  searchPrepare,
  keyFn,
  CellIcon,
  CellName,
  onSelect,
  onRequestClose,
  itemTestID
}: SelectModalProps<T, P>) => {
  const [searchValue, setSearchValue] = useState<string>('');
  const [topEdgeIsVisible, setTopEdgeIsVisible] = useState(true);

  const filteredOptions = useMemo(
    () =>
      searchKeys.length === 0
        ? options
        : searchAndFilterItems<T, P>(options, searchValue, searchKeys, searchPrepare, searchThreshold),
    [options, searchValue, searchKeys, searchPrepare, searchThreshold]
  );
  const searchBarIsVisible = searchKeys.length > 0;

  return (
    <PageModal title={title} opened={opened} onRequestClose={onRequestClose}>
      {searchBarIsVisible && (
        <div
          className={clsx(
            'p-4 pb-3',
            !topEdgeIsVisible && 'shadow-bottom border-b-0.5 border-lines overflow-y-visible'
          )}
        >
          <SearchBarField defaultRightMargin={false} value={searchValue} onValueChange={setSearchValue} />
        </div>
      )}

      <ScrollView
        className={clsx('gap-3', searchBarIsVisible ? 'pb-4' : 'py-4')}
        onTopEdgeVisibilityChange={setTopEdgeIsVisible}
        topEdgeThreshold={4}
      >
        {filteredOptions.length === 0 && <EmptyState />}

        {filteredOptions.map((option, index) => (
          <SelectModalOption<T>
            className={index === 0 ? 'mt-1' : ''}
            key={keyFn(option)}
            option={option}
            isSelected={keyFn(option) === keyFn(value)}
            CellIcon={CellIcon}
            CellName={CellName}
            onSelect={onSelect}
            testID={itemTestID}
          />
        ))}
      </ScrollView>
    </PageModal>
  );
};
