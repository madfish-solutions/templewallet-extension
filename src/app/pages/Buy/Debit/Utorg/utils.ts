import { isDefined } from '@rnw-community/shared';
import CurrencyListPackage from 'currency-list';

import { CurrencyBase } from 'app/templates/TopUpInput/types';
import { getCurrentLocale } from 'lib/i18n';

export const UTORG_TERMS_LINK = 'https://app.utorg.pro/terms';
export const UTORG_PRIVICY_LINK = 'https://app.utorg.pro/privacy';

const UTORG_FIAT_ICONS_BASE_URL = 'https://utorg.pro/img/flags2/icon-';

export const buildIconSrc = (currencyCode: string) => `${UTORG_FIAT_ICONS_BASE_URL}${currencyCode.slice(0, -1)}.svg`;

export const supplyCurrenciesNames = (currencies: CurrencyBase[]): CurrencyBase[] => {
  if (currencies.length === 0) return [];

  const locale = getCurrentLocale().replace('-', '_');

  const info = CurrencyListPackage.currencyList[locale];

  if (!isDefined(info)) return currencies;

  return currencies.map(currency => {
    const name = info[currency.code]?.name;

    return { ...currency, name };
  });
};
