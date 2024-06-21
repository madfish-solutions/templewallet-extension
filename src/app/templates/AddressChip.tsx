import React, { FC, useCallback } from 'react';

import classNames from 'clsx';

import { Button, HashChip } from 'app/atoms';
import { ReactComponent as GlobeIcon } from 'app/icons/globe.svg';
import { ReactComponent as HashIcon } from 'app/icons/hash.svg';
import { TestIDProps } from 'lib/analytics';
import { useStorage } from 'lib/temple/front';
import { useTezosDomainNameByAddress } from 'temple/front/tezos';
import { TezosNetworkEssentials } from 'temple/networks';

interface Props extends TestIDProps {
  address: string;
  tezosNetwork?: TezosNetworkEssentials | null;
  className?: string;
  small?: boolean;
  modeSwitchTestId?: string;
}

const TZDNS_MODE_ON_STORAGE_KEY = 'domain-displayed';

const AddressChip: FC<Props> = ({ address, tezosNetwork, className, small, modeSwitchTestId, ...rest }) => {
  const { data: tzdnsName } = useTezosDomainNameByAddress(address, tezosNetwork);

  const [domainDisplayed, setDomainDisplayed] = useStorage(TZDNS_MODE_ON_STORAGE_KEY, false);

  const handleToggleDomainClick = useCallback(() => void setDomainDisplayed(val => !val), [setDomainDisplayed]);

  const Icon = domainDisplayed ? HashIcon : GlobeIcon;

  return (
    <div className={classNames('flex', className)}>
      {tzdnsName && domainDisplayed ? (
        <HashChip hash={tzdnsName} firstCharsCount={7} lastCharsCount={10} small={small} {...rest} />
      ) : (
        <HashChip hash={address} small={small} {...rest} />
      )}

      {tzdnsName && (
        <Button
          type="button"
          className={classNames(
            'inline-flex items-center justify-center ml-2 rounded-sm p-1',
            'bg-gray-100 hover:shadow-xs hover:text-gray-600 text-gray-500 leading-none select-none',
            small ? 'text-xs' : 'text-sm',
            'transition ease-in-out duration-300'
          )}
          onClick={handleToggleDomainClick}
          testID={modeSwitchTestId}
          testIDProperties={{ toDomainMode: !domainDisplayed }}
        >
          <Icon className={classNames('w-auto stroke-current fill-current', small ? 'h-3' : 'h-4')} />
        </Button>
      )}
    </div>
  );
};

export default AddressChip;
