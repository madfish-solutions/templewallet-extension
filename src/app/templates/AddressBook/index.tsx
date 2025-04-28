import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { EmptyState } from 'app/atoms/EmptyState';
import { IconButton } from 'app/atoms/IconButton';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { TempleContact } from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';
import { SettingsTabProps } from 'lib/ui/settings-tab-props';
import { useSettings } from 'temple/front/ready';

import { SearchBarField } from '../SearchField';

import { Contact } from './components/Contact';
import { EmptySection } from './components/EmptySection';
import { EditAddContact } from './modals/EditAddContact';
import { searchAndFilterContacts } from './utils';

export const AddressBook = memo<SettingsTabProps>(({ setHeaderChildren }) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const [editAddContactModalOpened, setEditAddContactModalOpened, setEditAddContactModalClosed] =
    useBooleanState(false);

  const [selectedContact, setSelectedContact] = useState<TempleContact | null>(null);

  const { contacts } = useSettings();

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];

    return searchValueDebounced.length ? searchAndFilterContacts(contacts, searchValueDebounced) : contacts;
  }, [contacts, searchValueDebounced]);

  const handleContactClick = useCallback(
    (contact: TempleContact) => {
      setSelectedContact(contact);
      setEditAddContactModalOpened();
    },
    [setEditAddContactModalOpened]
  );

  const handleEditAddModalClose = useCallback(() => {
    setEditAddContactModalClosed();
    setSelectedContact(null);
  }, [setEditAddContactModalClosed]);

  const headerChildren = useMemo(
    () =>
      contacts?.length ? (
        <div className="flex p-4 pb-3 gap-x-2 items-center bg-background">
          <SearchBarField value={searchValue} onValueChange={setSearchValue} />

          <IconButton Icon={PlusIcon} color="blue" onClick={setEditAddContactModalOpened} />
        </div>
      ) : null,
    [contacts?.length, searchValue, setEditAddContactModalOpened]
  );

  useEffect(() => setHeaderChildren(headerChildren), [headerChildren, setHeaderChildren]);
  useEffect(() => {
    return () => setHeaderChildren(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FadeTransition>
      {contacts?.length ? (
        <div className="px-4 pt-1 pb-4 flex-1 flex flex-col overflow-y-auto">
          {filteredContacts.length ? (
            <div className="flex flex-col gap-y-3">
              {filteredContacts.map(contact => (
                <Contact key={contact.address} data={contact} onClick={handleContactClick} />
              ))}
            </div>
          ) : (
            <EmptyState stretch textI18n="noContactsFound" />
          )}
        </div>
      ) : (
        <EmptySection onAddContactClick={setEditAddContactModalOpened} />
      )}

      <EditAddContact
        contact={selectedContact}
        opened={editAddContactModalOpened}
        onRequestClose={handleEditAddModalClose}
      />
    </FadeTransition>
  );
});
