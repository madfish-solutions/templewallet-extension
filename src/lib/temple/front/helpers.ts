import { getMessage } from 'lib/i18n';
import { isAddressValid, isKTAddress } from 'lib/temple/helpers';
import { isTruthy } from 'lib/utils';

export function validateDerivationPath(p: string) {
  if (p.length === 0) return true;
  if (!p.startsWith('m')) {
    return getMessage('derivationPathMustStartWithM');
  }
  if (p.length > 1 && p[1] !== '/') {
    return getMessage('derivationSeparatorMustBeSlash');
  }

  const parts = p.replace('m', '').split('/').filter(isTruthy);
  if (
    !parts.every(itemPart => {
      const pNum = +(itemPart.includes("'") ? itemPart.replace("'", '') : itemPart);
      return Number.isSafeInteger(pNum) && pNum >= 0;
    })
  ) {
    return getMessage('invalidPath');
  }

  return true;
}

export function validateContractAddress(value: any) {
  switch (false) {
    case isAddressValid(value):
      return getMessage('invalidAddress');

    case isKTAddress(value):
      return getMessage('onlyKTContractAddressAllowed');

    default:
      return true;
  }
}
