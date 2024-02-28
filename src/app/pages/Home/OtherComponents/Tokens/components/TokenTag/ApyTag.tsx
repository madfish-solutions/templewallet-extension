import React, { FC, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import type { TokenApyInfo } from 'app/hooks/use-token-apy.hook';
import { KNOWN_TOKENS_SLUGS } from 'lib/assets/known-tokens';
import { isTruthy, openLink } from 'lib/utils';

import { AssetsSelectors } from '../../../Assets.selectors';
import modStyles from '../../Tokens.module.css';

interface Props {
  slug: string;
  symbol: string;
  apyInfo: TokenApyInfo;
}

const APR = 'APR';
const APY = 'APY';
const YOUVES_TOKENS_WITH_APR = [KNOWN_TOKENS_SLUGS.UUSD, KNOWN_TOKENS_SLUGS.UBTC, KNOWN_TOKENS_SLUGS.YOU];
const TAGS_CLASSNAME_RECORD: Record<string, string> = {
  [KNOWN_TOKENS_SLUGS.KUSD]: modStyles.kusdTag,
  [KNOWN_TOKENS_SLUGS.TZBTC]: modStyles.tzbtcTag,
  [KNOWN_TOKENS_SLUGS.USDT]: modStyles.usdtTag,
  [KNOWN_TOKENS_SLUGS.UUSD]: modStyles.youvesTag,
  [KNOWN_TOKENS_SLUGS.UBTC]: modStyles.youvesTag,
  [KNOWN_TOKENS_SLUGS.YOU]: modStyles.youvesTag
};

export const TokenApyTag: FC<Props> = ({ slug, symbol, apyInfo }) => {
  const tokenClassName = useMemo(() => TAGS_CLASSNAME_RECORD[slug], [slug]);

  const label = useMemo(() => (YOUVES_TOKENS_WITH_APR.includes(slug) ? APR : APY), [slug]);

  const { rate, link } = apyInfo;

  if (!isTruthy(rate) || !isTruthy(link)) return null;

  const displayRate = Number(new BigNumber(rate).decimalPlaces(2));

  return (
    <Button
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        openLink(link);
      }}
      testID={AssetsSelectors.assetItemApyButton}
      testIDProperties={{ slug, symbol, apyRate: rate }}
      className={classNames('ml-2 px-2 py-1', modStyles.tagBase, tokenClassName)}
    >
      {label}: {displayRate}%
    </Button>
  );
};
