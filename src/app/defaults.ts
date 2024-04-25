import { t } from 'lib/i18n';
import { getDerivationPath } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

export const OP_STACK_PREVIEW_SIZE = 2;

export class ArtificialError extends Error {}
export class NotEnoughFundsError extends ArtificialError {}
export class ZeroBalanceError extends NotEnoughFundsError {}
export class ZeroTEZBalanceError extends NotEnoughFundsError {}

export const ACCOUNT_OR_GROUP_NAME_PATTERN = /[^\s-].{0,16}$/;

export const PASSWORD_PATTERN = new RegExp(
  [
    '^',
    '(?=.*[a-z])', // Must contain at least 1 lowercase alphabetical character
    '(?=.*[A-Z])', // Must contain at least 1 uppercase alphabetical character
    '(?=.*[0-9])', // Must contain at least 1 numeric character
    '(?=.{8,})' // Must be eight characters or longer
  ].join('')
);

export const uppercaseLowercaseMixtureRegx = /(?=.*[a-z])(?=.*[A-Z])/;
export const lettersNumbersMixtureRegx = /(?=.*\d)(?=.*[A-Za-z])/;
export const specialCharacterRegx = /[!@#$%^&*()_+\-=\]{};':"\\|,.<>?]/;

export const URL_PATTERN =
  /(^(https:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$)|(^http(s)?:\/\/localhost:[0-9]+$)/;

export function formatMnemonic(m: string) {
  return m.replace(/\n/g, ' ').trim();
}

export function getAccountBadgeTitle(accountType: TempleAccountType) {
  switch (accountType) {
    case TempleAccountType.Imported:
      return t('importedAccount');

    case TempleAccountType.Ledger:
      return t('ledger');

    case TempleAccountType.ManagedKT:
      return t('managedKTAccount');

    case TempleAccountType.WatchOnly:
      return t('watchOnlyAccount');

    default:
      return null;
  }
}

export const DEFAULT_DERIVATION_PATH = getDerivationPath(TempleChainKind.Tezos, 0);
