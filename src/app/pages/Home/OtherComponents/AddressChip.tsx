import React, { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'clsx';
import useSWR from 'swr';

import { Button } from 'app/atoms';
import { ReactComponent as HashIcon } from 'app/icons/hash.svg';
import { ReactComponent as LanguageIcon } from 'app/icons/language.svg';
import HashChip from 'app/templates/HashChip';
import { TestIDProps } from 'lib/analytics';
import { useTezos, useTezosDomainsClient, fetchFromStorage, putToStorage } from 'lib/temple/front';

import { HomeSelectors } from '../Home.selectors';

type AddressChipProps = TestIDProps & {
  pkh: string;
  className?: string;
  small?: boolean;
};

const domainDisplayedKey = 'domain-displayed';

const AddressChip: FC<AddressChipProps> = ({ pkh, className, small, ...rest }) => {
  const tezos = useTezos();
  const { resolver: domainsResolver } = useTezosDomainsClient();

  const resolveDomainReverseName = useCallback(
    (_k: string, publicKeyHash: string) => domainsResolver.resolveAddressToName(publicKeyHash),
    [domainsResolver]
  );

  const { data: reverseName } = useSWR(() => ['tzdns-reverse-name', pkh, tezos.checksum], resolveDomainReverseName, {
    shouldRetryOnError: false,
    revalidateOnFocus: false
  });

  const [domainDisplayed, setDomainDisplayed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const val = await fetchFromStorage<boolean>(domainDisplayedKey);
        setDomainDisplayed(val ?? true);
      } catch {}
    })();
  }, [domainDisplayedKey, setDomainDisplayed]);

  const handleToggleDomainClick = useCallback(() => {
    setDomainDisplayed(d => {
      const newValue = !d;
      putToStorage(domainDisplayedKey, newValue);
      return newValue;
    });
  }, [setDomainDisplayed, domainDisplayedKey]);

  const Icon = domainDisplayed ? HashIcon : LanguageIcon;

  return (
    <div className={classNames('flex items-center', className)}>
      {reverseName && domainDisplayed ? (
        <HashChip hash={reverseName} firstCharsCount={7} lastCharsCount={10} small={small} {...rest} />
      ) : (
        <HashChip hash={pkh} small={small} {...rest} />
      )}

      {reverseName && (
        <Button
          type="button"
          className={classNames(
            'inline-flex items-center justify-center ml-2 rounded-sm',
            'bg-gray-100 shadow-xs hover:text-gray-600 text-gray-500 leading-none select-none',
            small ? 'text-xs' : 'text-sm',
            'transition ease-in-out duration-300'
          )}
          style={{
            padding: 3
          }}
          onClick={handleToggleDomainClick}
          testID={HomeSelectors.addressModeSwitchButton}
          testIDProperties={{ toDomainMode: !domainDisplayed }}
        >
          <Icon className={classNames('w-auto stroke-current', small ? 'h-3' : 'h-4')} />
        </Button>
      )}
    </div>
  );
};

export default AddressChip;
