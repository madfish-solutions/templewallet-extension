import { isAddress } from 'viem';

import { getMessage } from 'lib/i18n';

export const validateEvmContractAddress = (value: string) => (isAddress(value) ? true : getMessage('invalidAddress'));
