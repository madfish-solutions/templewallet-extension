import { TaquitoTezosDomainsClient } from '@tezos-domains/taquito-client';

import { t } from 'lib/i18n';
import { isAddressValid } from 'lib/temple/helpers';

import { isDomainNameValid } from './tzdns';

function validateAnyAddress(value: string) {
  switch (false) {
    case value?.length > 0:
      return true;

    case isAddressValid(value):
      return 'invalidAddress';

    default:
      return true;
  }
}

export const validateDelegate = async (
  value: string | null | undefined,
  domainsClient: TaquitoTezosDomainsClient,
  validateAddress: (value: string) => boolean | string = validateAnyAddress
) => {
  if (!value) return false;

  if (!domainsClient.isSupported) return validateAddress(value);

  if (isDomainNameValid(value, domainsClient)) {
    const resolved = await domainsClient.resolver.resolveNameToAddress(value);
    if (!resolved) {
      return validateAddress(value) || t('domainDoesntResolveToAddress', value);
    }

    value = resolved;
  }

  return isAddressValid(value) ? true : t('invalidAddressOrDomain');
};
