import React, { useEffect, useState, useMemo, memo } from 'react';

import classNames from 'clsx';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { ReactComponent as ContactBookIcon } from 'app/icons/monochrome/contact-book.svg';
import { T } from 'lib/i18n';
import { searchContacts } from 'lib/temple/front';
import { TempleContact } from 'lib/temple/types';

import ContactsDropdownItem from './ContactsDropdownItem';

export type ContactsDropdownProps = {
  contacts: TempleContact[];
  opened: boolean;
  onSelect: (address: string) => void;
  searchTerm: string;
};

const ContactsDropdown = memo<ContactsDropdownProps>(({ contacts, opened, onSelect, searchTerm }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filteredContacts = useMemo(
    () => (searchTerm ? searchContacts(contacts, searchTerm) : contacts),
    [contacts, searchTerm]
  );

  const activeItem = useMemo(
    () => (activeIndex !== null ? filteredContacts[activeIndex] : null),
    [filteredContacts, activeIndex]
  );

  useEffect(() => {
    setActiveIndex(i => getSearchTermIndex(i, searchTerm));
  }, [setActiveIndex, searchTerm]);

  useEffect(() => {
    if (!opened) {
      setActiveIndex(null);
    }
  }, [setActiveIndex, opened]);

  useEffect(() => {
    if (activeIndex !== null && activeIndex >= filteredContacts.length) {
      setActiveIndex(null);
    }
  }, [setActiveIndex, activeIndex, filteredContacts.length]);

  useEffect(() => {
    const keyHandler = (evt: KeyboardEvent) => handleKeyup(evt, activeItem, onSelect, setActiveIndex);
    window.addEventListener('keyup', keyHandler);
    return () => window.removeEventListener('keyup', keyHandler);
  }, [activeItem, setActiveIndex, onSelect]);

  return (
    <DropdownWrapper
      scaleAnimation={false}
      opened={opened}
      className={classNames(
        'z-dropdown absolute left-0 right-0 top-full max-h-44 mt-2',
        'origin-top overflow-x-hidden overflow-y-auto overscroll-contain'
      )}
    >
      {filteredContacts.length > 0 ? (
        filteredContacts.map(contact => (
          <ContactsDropdownItem
            key={contact.address}
            contact={contact}
            active={contact.address === activeItem?.address}
            onMouseDown={() => onSelect(contact.address)}
          />
        ))
      ) : (
        <div
          className={classNames(
            !opened && 'invisible',
            'flex items-center justify-center my-6',
            'text-gray-600 text-base font-light'
          )}
        >
          <ContactBookIcon className="w-5 h-auto mr-1 stroke-current" />
          <span>
            <T id="noContactsFound" />
          </span>
        </div>
      )}
    </DropdownWrapper>
  );
});

export default ContactsDropdown;

const getSearchTermIndex = (i: number | null, searchTerm: string) => (searchTerm ? getDefinedIndex(i) : i);
const getDefinedIndex = (i: number | null) => (i !== null ? i : 0);
const getMinimumIndex = (i: number | null) => (i !== null ? i + 1 : 0);
const getMaximumIndex = (i: number | null) => {
  if (i === null) return i;
  return i > 0 ? i - 1 : 0;
};

const handleKeyup = (
  evt: KeyboardEvent,
  activeItem: TempleContact | null,
  onSelect: (address: string) => void,
  setActiveIndex: (value: React.SetStateAction<number | null>) => void
) => {
  switch (evt.key) {
    case 'Enter':
      if (activeItem) {
        onSelect(activeItem.address);
        (document.activeElement as any)?.blur();
      }
      break;

    case 'ArrowDown':
      setActiveIndex(i => getMinimumIndex(i));
      break;

    case 'ArrowUp':
      setActiveIndex(i => getMaximumIndex(i));
      break;
  }
};
