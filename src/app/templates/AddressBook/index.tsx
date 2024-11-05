import React, { FC, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { EmptyState } from 'app/atoms/EmptyState';
import { IconButton } from 'app/atoms/IconButton';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { useBooleanState } from 'lib/ui/hooks';
import { useSettings } from 'temple/front/ready';

import { SearchBarField } from '../SearchField';

import { Contact } from './components/Contact';
import { EmptySection } from './components/EmptySection';
import { AddContact } from './modals/addContact';
import { searchAndFilterContacts } from './utils';

export const AddressBook: FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const [addContactModalOpened, setAddContactModalOpened, setAddContactModalClosed] = useBooleanState(false);

  const { contacts } = useSettings();

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];

    return searchValueDebounced.length ? searchAndFilterContacts(contacts, searchValueDebounced) : contacts;
  }, [contacts, searchValueDebounced]);

  if (!contacts) return <EmptySection onAddContactClick={setAddContactModalOpened} />;

  return (
    <>
      <div className="flex gap-x-2 p-4">
        <SearchBarField value={searchValue} onValueChange={setSearchValue} />

        <IconButton Icon={PlusIcon} color="blue" onClick={setAddContactModalOpened} />
      </div>

      <div className="px-4 pb-4 flex-1 flex flex-col overflow-y-auto">
        {filteredContacts.length ? (
          <div className="flex flex-col gap-y-3">
            {filteredContacts.map(contact => (
              <Contact key={contact.address} data={contact} onClick={() => 1} />
            ))}
          </div>
        ) : (
          <EmptyState stretch textI18n="noContactsFound" />
        )}
      </div>

      <AddContact opened={addContactModalOpened} onRequestClose={setAddContactModalClosed} />
    </>
  );
};
