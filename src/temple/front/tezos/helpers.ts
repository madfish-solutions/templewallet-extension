import { getMessage } from 'lib/i18n';
import { isValidTezosAddress, isTezosContractAddress } from 'lib/tezos';

export function validateTezosContractAddress(value: string) {
  if (!isTezosContractAddress(value)) return getMessage('onlyKTContractAddressAllowed');

  if (!isValidTezosAddress(value)) return getMessage('invalidAddress');

  return true;
}
