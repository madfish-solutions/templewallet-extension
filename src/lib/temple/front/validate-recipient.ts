import { validate as multinetworkValidateAddress } from '@temple-wallet/wallet-address-validator';
import { isDefined } from '@rnw-community/shared';
import { TaquitoTezosDomainsClient } from '@tezos-domains/taquito-client';

import { t } from 'lib/i18n';

import { otherNetworks } from './other-networks';
import { validateDelegate } from './validate-delegate';

export const validateRecipient = async (
  value: string | null | undefined,
  domainsClient: TaquitoTezosDomainsClient,
  validateAddress?: (value: string) => boolean | string
) => {
  const matchingOtherNetwork = isDefined(value)
    ? otherNetworks.find(({ slug }) => multinetworkValidateAddress(value, slug))
    : undefined;

  if (isDefined(matchingOtherNetwork)) {
    return t('otherNetworkAddressError', matchingOtherNetwork.name);
  }

  return validateDelegate(value, domainsClient, validateAddress);
};
