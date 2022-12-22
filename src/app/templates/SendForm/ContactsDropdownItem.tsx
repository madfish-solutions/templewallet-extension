import React, { ComponentProps, FC, useEffect, useRef } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import HashShortView from 'app/atoms/HashShortView';
import Identicon from 'app/atoms/Identicon';
import Name from 'app/atoms/Name';
import { T } from 'lib/i18n';
import { TempleContact } from 'lib/temple/types';

import { SendFormSelectors } from '../SendForm.selectors';

type ContactsDropdownItemProps = ComponentProps<typeof Button> & {
  contact: TempleContact;
  active?: boolean;
};

const ContactsDropdownItem: FC<ContactsDropdownItemProps> = ({ contact, active, ...rest }) => {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (active) {
      ref.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [active]);

  return (
    <Button
      ref={ref}
      type="button"
      trackID={SendFormSelectors.ContactItemButton}
      className={classNames(
        'w-full flex items-center',
        'p-2 text-left',
        active ? 'bg-gray-100' : 'hover:bg-gray-100 focus:bg-gray-100'
      )}
      tabIndex={-1}
      {...rest}
    >
      <Identicon type="bottts" hash={contact.address} size={32} className="flex-shrink-0 shadow-xs" />

      <div className="ml-3 flex flex-1 w-full">
        <div className="flex flex-col justify-between flex-1">
          <Name className="mb-px text-sm font-medium leading-tight text-left">{contact.name}</Name>

          <span className={classNames('text-xs font-light leading-tight text-gray-600')}>
            <HashShortView hash={contact.address} />
          </span>
        </div>

        {contact.accountInWallet ? (
          <div className="flex items-center">
            <span
              className={classNames(
                'mx-1',
                'rounded-sm',
                'border border-opacity-25',
                'px-1 py-px',
                'leading-tight',
                'text-opacity-50',
                'border-black text-black'
              )}
              style={{ fontSize: '0.6rem' }}
            >
              <T id="ownAccount" />
            </span>
          </div>
        ) : null}
      </div>
    </Button>
  );
};

export default ContactsDropdownItem;
