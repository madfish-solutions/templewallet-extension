import { TaquitoTezosDomainsClient } from '@tezos-domains/taquito-client';
import memoize from 'micro-memoize';

import { t } from 'lib/i18n';
import { isDomainNameValid } from 'lib/temple/front';
import { isAddressValid } from 'lib/temple/helpers';
import { fifoResolve } from 'lib/utils';

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

const fifoResolveNameToAddress = memoize(
  (domainsClient: TaquitoTezosDomainsClient): ((name: string) => Promise<string | null>) =>
    fifoResolve(domainsClient.resolver.resolveNameToAddress)
);

export const validateDelegate = async (
  value: string | null | undefined,
  domainsClient: TaquitoTezosDomainsClient,
  validateAddress: (value: string) => boolean | string = validateAnyAddress
) => {
  if (!value) return false;

  if (!domainsClient.isSupported) return validateAddress(value);

  if (isDomainNameValid(value, domainsClient)) {
    const resolved = await fifoResolveNameToAddress(domainsClient)(value);
    if (!resolved) {
      return validateAddress(value) || t('domainDoesntResolveToAddress', value);
    }

    value = resolved;
  }

  return isAddressValid(value) ? true : t('invalidAddressOrDomain');
};
