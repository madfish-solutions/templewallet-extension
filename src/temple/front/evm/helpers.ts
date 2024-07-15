import { isAddress } from 'viem';

import { getMessage } from 'lib/i18n';

export function validateEvmContractAddress(value: string) {
  if (!isAddress(value)) return getMessage('invalidAddress');

  return true;
}
