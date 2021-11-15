import React, { useEffect, useState, useMemo, memo } from 'react';

import classNames from 'clsx';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { ReactComponent as ContactBookIcon } from 'app/icons/contact-book.svg';
import { T } from 'lib/i18n/react';
import { TempleContact, searchContacts } from 'lib/temple/front';

import ContactsDropdownItem from './ContactsDropdownItem';

type ContactsDropdownProps = {
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
    setActiveIndex(i => (searchTerm ? (i !== null ? i : 0) : i));
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
    const handleKeyup = (evt: KeyboardEvent) => {
      switch (evt.key) {
        case 'Enter':
          if (activeItem) {
            onSelect(activeItem.address);
            (document.activeElement as any)?.blur();
          }
          break;

        case 'ArrowDown':
          setActiveIndex(i => (i !== null ? i + 1 : 0));
          break;

        case 'ArrowUp':
          setActiveIndex(i => (i !== null ? (i > 0 ? i - 1 : 0) : i));
          break;
      }
    };

    window.addEventListener('keyup', handleKeyup);
    return () => window.removeEventListener('keyup', handleKeyup);
  }, [activeItem, setActiveIndex, onSelect]);

  return (
    <DropdownWrapper
      scaleAnimation={false}
      opened={opened}
      className={classNames(
        'absolute left-0 right-0',
        'origin-top overflow-x-hidden overflow-y-auto',
        'z-50',
        'overscroll-contain'
      )}
      style={{
        top: '100%',
        maxHeight: '11rem',
        backgroundColor: 'white',
        borderColor: '#e2e8f0',
        padding: 0
      }}
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
