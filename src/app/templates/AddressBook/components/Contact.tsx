import { memo } from 'react';

import { HashShortView, IconBase } from 'app/atoms';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { EvmNetworksLogos, TezNetworkLogo } from 'app/atoms/NetworksLogos';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { TempleContact } from 'lib/temple/types';
import { useCopyText } from 'lib/ui/hooks/use-copy-text';

import { isEvmContact } from '../utils';

interface ContactProps {
  data: TempleContact;
  onClick: SyncFn<TempleContact>;
}

export const Contact = memo<ContactProps>(({ data, onClick }) => (
  <div
    className="flex flex-row justify-between items-center p-3 rounded-lg cursor-pointer bg-white border-0.5 border-lines group"
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
  <div className="flex flex-row items-center p-0.5 cursor-pointer" onClick={useCopyText(address, true)}>
    <span className="text-font-description text-grey-1 group-hover:text-secondary">
      <HashShortView hash={address} />
    </span>
    <IconBase Icon={CopyIcon} size={12} className="ml-0.5 text-secondary hidden group-hover:block" />
  </div>
));
