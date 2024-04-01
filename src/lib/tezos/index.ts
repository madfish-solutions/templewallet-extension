import type { ManagerKeyResponse } from '@taquito/rpc';
import { validateAddress, ValidationResult } from '@taquito/utils';

export function isValidTezosAddress(address: string) {
  return validateAddress(address) === ValidationResult.VALID;
}

export function isTezosContractAddress(address: string) {
  return address.startsWith('KT');
}

export function isValidTezosContractAddress(address: string) {
  return isTezosContractAddress(address) && isValidTezosAddress(address);
}

export function tezosManagerKeyHasManager(manager: ManagerKeyResponse) {
  return manager && typeof manager === 'object' ? !!manager.key : !!manager;
}
