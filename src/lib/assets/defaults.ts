import { browser } from 'lib/browser';

export const TEZ_TOKEN_SLUG = 'tez' as const;
export const EVM_TOKEN_SLUG = 'eth' as const;

export const TEZOS_SYMBOL = 'ꜩ';
export const TEZOS_DCP_SYMBOL = 'ф';

export const TEZOS_GAS_ICON_SRC = browser.runtime.getURL('misc/token-logos/tez.svg');
export const TEZOS_DCP_GAS_ICON_SRC = browser.runtime.getURL('misc/token-logos/film.png');
