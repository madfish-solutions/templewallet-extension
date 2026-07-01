import { getMoonPayCurrencies, CurrencyType as MoonPayCurrencyType } from 'lib/apis/moonpay';
import { getCurrenciesInfo, CurrencyInfoType as UtorgCurrencyInfoType } from 'lib/apis/utorg';
import { toTopUpTokenSlug } from 'lib/buy-with-credit-card/top-up-token-slug.utils';
import type { FiatCurrencyOptionBase } from 'lib/fiat-currency/types';
import { fetchFromStorage } from 'lib/storage';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

import { persistentCache } from './persistent-cache';

export interface BuyPreselect {
  fiat: string;
  supported: boolean;
}

const UTORG_CHAIN_CHAIN_ID_MAP: Record<string, string> = {
  ARBITRUM: '42161',
  AVALANCHE: '43114',
  POLYGON: '137',
  ETHEREUM: '1',
  BINANCE_SMART_CHAIN: '56',
  VECHAIN: '100009'
};

interface ProviderLists {
  cryptoSlugs: string[];
  fiatCodes: string[];
}

const buildLists = async (): Promise<ProviderLists> => {
  const [moonpay, utorg] = await Promise.allSettled([getMoonPayCurrencies(), getCurrenciesInfo()]);

  const cryptoSlugs = new Set<string>();
  const fiatCodes = new Set<string>();

  if (moonpay.status === 'fulfilled') {
    for (const currency of moonpay.value) {
      if (currency.type === MoonPayCurrencyType.Fiat) {
        if (currency.isSellSupported) fiatCodes.add(currency.code.toUpperCase());
        continue;
      }
      if (!currency.supportsLiveMode || currency.isSuspended) continue;
      const isTez = currency.metadata.networkCode.toLowerCase() === 'tezos';
      if (!isTez && currency.metadata.chainId == null) continue;
      cryptoSlugs.add(
        toTopUpTokenSlug(
          currency.code.toUpperCase().split('_')[0]!,
          isTez ? TempleChainKind.Tezos : TempleChainKind.EVM,
          isTez ? TEZOS_MAINNET_CHAIN_ID : currency.metadata.chainId!
        )
      );
    }
  }

  if (utorg.status === 'fulfilled') {
    for (const currency of utorg.value) {
      if (currency.type === UtorgCurrencyInfoType.FIAT) {
        if (currency.depositMax > 0) fiatCodes.add(currency.symbol.toUpperCase());
        continue;
      }
      const { chain } = currency;
      if (!currency.enabled || currency.depositMax <= 0 || !chain) continue;
      const isTez = chain === 'TEZOS';
      if (!isTez && !UTORG_CHAIN_CHAIN_ID_MAP[chain]) continue;
      cryptoSlugs.add(
        toTopUpTokenSlug(
          currency.display.toUpperCase(),
          isTez ? TempleChainKind.Tezos : TempleChainKind.EVM,
          isTez ? TEZOS_MAINNET_CHAIN_ID : UTORG_CHAIN_CHAIN_ID_MAP[chain]!
        )
      );
    }
  }

  return { cryptoSlugs: [...cryptoSlugs], fiatCodes: [...fiatCodes] };
};

const ensureLists = persistentCache<ProviderLists>({
  storageKey: 'WEB_WIDGETS_BUY_LISTS',
  ttlMs: 6 * 60 * 60 * 1000,
  fallback: { cryptoSlugs: [], fiatCodes: [] },
  build: buildLists,
  isValid: ({ cryptoSlugs }) => cryptoSlugs.length > 0
});

export const getBuyPreselect = async (
  symbol: string,
  chainKind: TempleChainKind,
  chainId: string
): Promise<BuyPreselect> => {
  const { cryptoSlugs, fiatCodes } = await ensureLists();

  const tokenSlug = toTopUpTokenSlug(symbol.toUpperCase(), chainKind, chainId);
  const supported = cryptoSlugs.includes(tokenSlug);

  const stored = await fetchFromStorage<FiatCurrencyOptionBase>('fiat_currency').catch(() => null);
  const code = stored?.name?.toUpperCase();
  const fiat = code && fiatCodes.includes(code) ? code : 'USD';

  return { fiat, supported };
};
