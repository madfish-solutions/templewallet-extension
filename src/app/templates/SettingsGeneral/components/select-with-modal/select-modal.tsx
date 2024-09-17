import React, { useMemo, useState } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { PageModal } from 'app/atoms/PageModal';
import { SearchBarField } from 'app/templates/SearchField';
import { t } from 'lib/i18n';
import { searchAndFilterItems } from 'lib/utils/search-items';

import { SelectModalOption, SelectModalOptionProps } from './select-modal-option';

export interface SelectModalProps<T, P extends null | SyncFn<T, any>>
  extends Pick<SelectModalOptionProps<T>, 'CellIcon' | 'CellName' | 'onSelect'> {
  opened: boolean;
  options: T[];
  value: T;
  searchKeys: Arguments<typeof searchAndFilterItems<T, P>>[2];
  searchThreshold?: number;
  searchPrepare?: P;
  keyFn: SyncFn<T, string | number>;
  onRequestClose: EmptyFn;
  itemTestID: string;
}

export const SelectModal = <T, P extends null | SyncFn<T, any>>({
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

  const filteredOptions = useMemo(
    () => searchAndFilterItems<T, P>(options, searchValue, searchKeys, searchPrepare, searchThreshold),
    [options, searchValue, searchKeys, searchPrepare, searchThreshold]
  );

  return (
    <PageModal title={t('language')} opened={opened} onRequestClose={onRequestClose}>
      <div className="p-4">
        <SearchBarField value={searchValue} onValueChange={setSearchValue} />
      </div>

      <div className="px-4 flex-1 flex flex-col overflow-y-auto gap-3 pb-4">
        {filteredOptions.length === 0 && <EmptyState variant="searchUniversal" />}

        {filteredOptions.map(option => (
          <SelectModalOption<T>
            key={keyFn(option)}
            option={option}
            isSelected={keyFn(option) === keyFn(value)}
            CellIcon={CellIcon}
            CellName={CellName}
            onSelect={onSelect}
            testID={itemTestID}
          />
        ))}
      </div>
    </PageModal>
  );
};
