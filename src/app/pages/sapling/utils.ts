import { BigNumber } from 'bignumber.js';

import { t } from 'lib/i18n';
import { isValidSaplingAddress } from 'lib/tezos';

export const validateAmount = (amount: string) => {
  if (!amount) return t('required');

  return new BigNumber(amount).gte(0) || t('amountMustBeGte', '0');
};

export const validateSaplingAddress = (address: string) => {
  if (!address) return t('required');

  return isValidSaplingAddress(address) || t('invalidAddress');
};
