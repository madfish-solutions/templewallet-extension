import { t } from 'lib/i18n';
import { TempleAccountType } from 'lib/temple/types';

export class ArtificialError extends Error {}

export const ACCOUNT_OR_GROUP_NAME_PATTERN = /^[^!@#$%^&*()_+\-=\]{};':"\\|,.<>?]{1,16}$/;

export const PASSWORD_PATTERN = new RegExp(
  [
    '^',
    '(?=.*[a-z])', // Must contain at least 1 lowercase alphabetical character
    '(?=.*[A-Z])', // Must contain at least 1 uppercase alphabetical character
    '(?=.*[0-9])', // Must contain at least 1 numeric character
    '(?=.{8,})' // Must be eight characters or longer
  ].join('')
);

export type PasswordValidation = Record<'minChar' | 'number' | 'specialChar' | 'lowerCase' | 'upperCase', boolean>;

export const passwordValidationRegexes: Record<keyof PasswordValidation, RegExp> = {
  minChar: /.{8,}/,
  number: /\d/,
  specialChar: /[!@#$%^&*()_+\-=\]{};':"\\|,.<>?]/,
  lowerCase: /[a-z]/,
  upperCase: /[A-Z]/
};

export function createUrlPattern(allowHttp: boolean) {
  return new RegExp(
    String.raw`^http${
      allowHttp ? 's?' : 's'
    }:\/\/([\w.-]+(?:\.[\w.-]+)+|localhost)(:[0-9]+)?(\/[\w\-._~/?#[\]@!$&'()*+,;=.]*)?$`
  );
}

export function formatMnemonic(m: string) {
  return m.replace(/\n/g, ' ').trim();
}

export function getAccountBadgeTitle(accountType: TempleAccountType) {
  switch (accountType) {
    case TempleAccountType.HD:
      return t('hdAccount');

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
