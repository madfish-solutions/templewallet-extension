import { browser } from 'lib/browser';

export const TEZ_TOKEN_SLUG = 'tez' as const;

export const TEZOS_SYMBOL = 'ꜩ';
export const TEZOS_DCP_SYMBOL = 'ф';

export const TEZOS_GAS_ICON_SRC = browser.runtime.getURL('misc/token-logos/tez.svg');
export const TEZOS_DCP_GAS_ICON_SRC = browser.runtime.getURL('misc/token-logos/film.png');

interface TezosGasToken {
  logo: string;
  symbol: string;
  isDcpNetwork?: true;
}

export const TEZOS_GAS_TOKEN: TezosGasToken = {
  logo: TEZOS_GAS_ICON_SRC,
  symbol: TEZOS_SYMBOL
};

export const TEZOS_DCP_GAS_TOKEN: TezosGasToken = {
  logo: TEZOS_DCP_GAS_ICON_SRC,
  symbol: TEZOS_DCP_SYMBOL,
  isDcpNetwork: true
};
