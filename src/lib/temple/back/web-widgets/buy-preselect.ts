import { getMoonPayCurrencies } from 'lib/apis/moonpay';
import { getCurrenciesInfo } from 'lib/apis/utorg';
import {
  isEligibleMoonPayCrypto,
  isEligibleMoonPayFiat,
  isEligibleUtorgCrypto,
  isEligibleUtorgFiat,
  moonPayCryptoToTopUpSlug,
  utorgCryptoToTopUpSlug
} from 'lib/buy-with-credit-card/provider-currencies.utils';
import { toTopUpTokenSlug } from 'lib/buy-with-credit-card/top-up-token-slug.utils';
import type { FiatCurrencyOptionBase } from 'lib/fiat-currency/types';
import { fetchFromStorage } from 'lib/storage';
import { equalsIgnoreCase } from 'lib/utils';
import { ONE_HOUR_MS } from 'lib/utils/numbers';
import { TempleChainKind } from 'temple/types';

import { persistentCache } from './persistent-cache';

const BUY_LISTS_TTL_MS = 6 * ONE_HOUR_MS;

export interface BuyPreselect {
  fiat: string;
  supported: boolean;
}

interface ProviderList {
  cryptoSlugs: string[];
  fiatCodes: string[];
}

interface ProviderLists {
  moonpay: ProviderList;
  utorg: ProviderList;
}

const EMPTY_LIST: ProviderList = { cryptoSlugs: [], fiatCodes: [] };

const buildLists = async (): Promise<ProviderLists> => {
  const [moonpay, utorg] = await Promise.allSettled([getMoonPayCurrencies(), getCurrenciesInfo()]);

  return {
    moonpay:
      moonpay.status === 'fulfilled'
        ? {
            cryptoSlugs: moonpay.value.filter(isEligibleMoonPayCrypto).map(moonPayCryptoToTopUpSlug),
            fiatCodes: moonpay.value.filter(isEligibleMoonPayFiat).map(({ code }) => code.toUpperCase())
          }
        : EMPTY_LIST,
    utorg:
      utorg.status === 'fulfilled'
        ? {
            cryptoSlugs: utorg.value.filter(isEligibleUtorgCrypto).map(utorgCryptoToTopUpSlug),
            fiatCodes: utorg.value.filter(isEligibleUtorgFiat).map(({ symbol }) => symbol.toUpperCase())
          }
        : EMPTY_LIST
  };
};

const ensureLists = persistentCache<ProviderLists>({
  storageKey: 'WEB_WIDGETS_BUY_LISTS',
  ttlMs: BUY_LISTS_TTL_MS,
  fallback: { moonpay: EMPTY_LIST, utorg: EMPTY_LIST },
  build: buildLists,
  isValid: ({ moonpay, utorg }) => moonpay.cryptoSlugs.length > 0 || utorg.cryptoSlugs.length > 0
});

export const getBuyPreselect = async (
  symbol: string,
  chainKind: TempleChainKind,
  chainId: string
): Promise<BuyPreselect> => {
  const { moonpay, utorg } = await ensureLists();

  const tokenSlug = toTopUpTokenSlug(symbol.toUpperCase(), chainKind, chainId);
  const eligibleProviders = [moonpay, utorg].filter(({ cryptoSlugs }) =>
    cryptoSlugs.some(slug => equalsIgnoreCase(slug, tokenSlug))
  );
  const supported = eligibleProviders.length > 0;

  const stored = await fetchFromStorage<FiatCurrencyOptionBase>('fiat_currency').catch(() => null);
  const code = stored?.name?.toUpperCase();
  // The fiat must be usable with the same provider that sells the token, else the pair is unbuyable.
  const fiat = code && eligibleProviders.some(({ fiatCodes }) => fiatCodes.includes(code)) ? code : 'USD';

  return { fiat, supported };
};
