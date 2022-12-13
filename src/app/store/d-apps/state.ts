import { KNOWN_TOKENS_SLUGS } from 'lib/temple/assets';

import { YUPANA_LEND_LINK, KORDFI_LEND_LINK } from './utils';

type TokenSlug = string;

export type TokenApyInfo = { rate: number; link: string };

export interface DAppsState {
  tokensApyInfo: Record<TokenSlug, TokenApyInfo>;
}

export const dAppsInitialState: DAppsState = {
  tokensApyInfo: {
    [KNOWN_TOKENS_SLUGS.KUSD]: {
      rate: 0,
      link: YUPANA_LEND_LINK
    },
    [KNOWN_TOKENS_SLUGS.tzBTC]: {
      rate: 0,
      link: KORDFI_LEND_LINK
    },
    [KNOWN_TOKENS_SLUGS.USDT]: {
      rate: 0,
      link: YUPANA_LEND_LINK
    }
  }
};
