import React, { ComponentProps, FC } from 'react';

import classNames from 'clsx';

import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { Button } from 'app/atoms/Button';
import HashShortView from 'app/atoms/HashShortView';
import Name from 'app/atoms/Name';
import { setAnotherSelector } from 'lib/analytics';
import { T } from 'lib/i18n';
import { TempleContact } from 'lib/temple/types';
import { useScrollIntoView } from 'lib/ui/use-scroll-into-view';

type ContactsDropdownItemProps = ComponentProps<typeof Button> & {
  contact: TempleContact;
  active?: boolean;
};

const ContactsDropdownItem: FC<ContactsDropdownItemProps> = ({ contact, active, ...rest }) => {
  const ref = useScrollIntoView<HTMLButtonElement>(active, { behavior: 'smooth', block: 'start' });

  return (
    <Button
      ref={ref}
      type="button"
      className={classNames(
        'w-full flex items-center',
        'p-2 text-left',
        active ? 'bg-gray-100' : 'hover:bg-gray-100 focus:bg-gray-100'
      )}
      tabIndex={-1}
      {...rest}
    >
      <AccountAvatar seed={contact.address} size={32} className="flex-shrink-0" />

      <div className="ml-3 flex flex-1 w-full">
        <div className="flex flex-col justify-between flex-1">
          <Name className="mb-px text-sm font-medium leading-tight text-left">{contact.name}</Name>

          <span
            className={classNames('text-xs font-light leading-tight text-gray-600')}
            {...setAnotherSelector('hash', contact.address)}
          >
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
