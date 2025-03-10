import React, { memo } from 'react';

import clsx from 'clsx';

import { HashShortView, IconBase } from 'app/atoms';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { EvmNetworksLogos, TezNetworkLogo } from 'app/atoms/NetworksLogos';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { toastSuccess } from 'app/toaster';
import { t } from 'lib/i18n';
import { TempleContact } from 'lib/temple/types';

import { isEvmContact } from '../utils';

interface ContactProps {
  data: TempleContact;
  onClick: (contact: TempleContact) => void;
}

export const Contact = memo<ContactProps>(({ data, onClick }) => (
  <div
    className={clsx(
      'flex flex-row justify-between items-center p-3',
      'rounded-lg shadow-bottom border group',
      'cursor-pointer border-transparent hover:border-lines'
    )}
    onClick={() => onClick(data)}
  >
    <div className="flex flex-row items-center gap-x-1.5">
      <AccountAvatar seed={data.address} size={32} borderColor="gray" />

      <div className="flex flex-col">
        <span className="text-font-medium-bold">{data.name}</span>
        <Address address={data.address} />
      </div>
    </div>

    {isEvmContact(data.address) ? <EvmNetworksLogos /> : <TezNetworkLogo />}
  </div>
));

interface AddressProps {
  address: string;
}

const Address = memo<AddressProps>(({ address }) => (
  <div
    className="flex flex-row items-center p-0.5 cursor-pointer"
    onClick={e => {
      e.stopPropagation();
      window.navigator.clipboard.writeText(address);
      toastSuccess(t('copiedAddress'));
    }}
  >
    <span className="text-font-description text-grey-1 group-hover:text-secondary">
      <HashShortView hash={address} />
    </span>
    <IconBase Icon={CopyIcon} size={12} className="ml-0.5 text-secondary hidden group-hover:block" />
  </div>
));
