import { TaquitoTezosDomainsClient } from '@tezos-domains/taquito-client';

import { isAddressValid, isDomainNameValid } from 'lib/temple/front';

export const validateDelegate = async (
  value: any,
  canUseDomainNames: boolean,
  domainsClient: TaquitoTezosDomainsClient,
  t: any,
  validateAddress: (value: any) => boolean | string
) => {
  if (!value?.length || value.length < 0) {
    return false;
  }

  if (!canUseDomainNames) {
    return validateAddress(value);
  }

  if (isDomainNameValid(value, domainsClient)) {
    const resolved = await domainsClient.resolver.resolveNameToAddress(value);
    if (!resolved) {
      return validateAddress(value) || t('domainDoesntResolveToAddress', value);
    }

    value = resolved;
  }

  return isAddressValid(value) ? true : t('invalidAddressOrDomain');
};
