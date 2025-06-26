import { TaquitoTezosDomainsClient } from '@tezos-domains/taquito-client';

import { t } from 'lib/i18n';
import { isValidTezosAddress } from 'lib/tezos';
import { isTezosDomainsNameValid } from 'temple/front/tezos';

function validateAnyAddress(value: string) {
  switch (false) {
    case value?.length > 0:
      return true;

    case isValidTezosAddress(value):
      return t('invalidAddress');

    default:
      return true;
  }
}

export const validateDelegate = async (
  value: string | null | undefined,
  domainsClient?: TaquitoTezosDomainsClient,
  validateAddress: (value: string) => boolean | string = validateAnyAddress
) => {
  if (!value) return false;

  if (!domainsClient || !domainsClient.isSupported) return validateAddress(value);

  if (isTezosDomainsNameValid(value, domainsClient)) {
    const resolved = await domainsClient.resolver.resolveNameToAddress(value);
    if (!resolved) {
      return validateAddress(value) || t('domainDoesntResolveToAddress', value);
    }

    value = resolved;
  }

  return isValidTezosAddress(value) ? true : t('invalidAddressOrDomain');
};
