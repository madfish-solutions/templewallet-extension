import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useTokensApyRatesSelector } from 'app/store/d-apps';
import { KNOWN_TOKENS_SLUGS } from 'lib/assets/known-tokens';

const YUPANA_LEND_LINK = 'https://app.yupana.finance/lending';

const TOKEN_APY_LINKS: Readonly<Record<string, string | undefined>> = {
  [KNOWN_TOKENS_SLUGS.KUSD]: YUPANA_LEND_LINK,
  [KNOWN_TOKENS_SLUGS.USDT]: YUPANA_LEND_LINK,
  [KNOWN_TOKENS_SLUGS.TZBTC]: YUPANA_LEND_LINK
};

export interface TokenApyInfo {
  rate: number;
  link?: string;
}

export const useTokenApyInfo = (slug: string): TokenApyInfo | undefined => {
  const apyRates = useTokensApyRatesSelector();

  const rate = apyRates[slug] || 0;

  const link = TOKEN_APY_LINKS[slug];

  return useMemo(() => {
    if (!isDefined(link) && rate === 0) {
      return;
    }

    return {
      rate,
      link
    };
  }, [rate, link]);
};
