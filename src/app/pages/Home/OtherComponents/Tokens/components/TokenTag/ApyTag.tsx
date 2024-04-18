import React, { FC, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { useTokenApyRateSelector } from 'app/store/d-apps';
import { KNOWN_TOKENS_SLUGS } from 'lib/assets/known-tokens';
import { openLink } from 'lib/utils';

import { AssetsSelectors } from '../../../Assets.selectors';
import modStyles from '../../Tokens.module.css';

interface Props {
  slug: string;
  symbol: string;
}

const APR = 'APR';
const APY = 'APY';

const YOUVES_TOKENS_WITH_APR = [KNOWN_TOKENS_SLUGS.UUSD, KNOWN_TOKENS_SLUGS.UBTC, KNOWN_TOKENS_SLUGS.YOU];

const TAGS_CLASSNAME_RECORD: StringRecord = {
  [KNOWN_TOKENS_SLUGS.KUSD]: modStyles.kusdTag,
  [KNOWN_TOKENS_SLUGS.TZBTC]: modStyles.tzbtcTag,
  [KNOWN_TOKENS_SLUGS.USDT]: modStyles.usdtTag,
  [KNOWN_TOKENS_SLUGS.UUSD]: modStyles.youvesTag,
  [KNOWN_TOKENS_SLUGS.UBTC]: modStyles.youvesTag,
  [KNOWN_TOKENS_SLUGS.YOU]: modStyles.youvesTag
};

const YUPANA_LEND_LINK = 'https://app.yupana.finance/lending';
const YOUVES_LINK = 'https://app.youves.com/earn';

const TOKEN_APY_LINKS: StringRecord = {
  [KNOWN_TOKENS_SLUGS.KUSD]: YUPANA_LEND_LINK,
  [KNOWN_TOKENS_SLUGS.USDT]: YUPANA_LEND_LINK,
  [KNOWN_TOKENS_SLUGS.TZBTC]: YUPANA_LEND_LINK,
  [KNOWN_TOKENS_SLUGS.UUSD]: YOUVES_LINK,
  [KNOWN_TOKENS_SLUGS.UBTC]: YOUVES_LINK,
  [KNOWN_TOKENS_SLUGS.YOU]: YOUVES_LINK
};

export const TokenApyTag: FC<Props> = ({ slug, symbol }) => {
  const rate = useTokenApyRateSelector(slug);

  const params = useMemo(() => {
    if (!rate) return null;

    const link = TOKEN_APY_LINKS[slug];
    if (!link) return null;

    const label = YOUVES_TOKENS_WITH_APR.includes(slug) ? APR : APY;

    const displayRate = Number(new BigNumber(rate).decimalPlaces(2));

    const onClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      openLink(link);
    };

    return { rate, displayRate, label, onClick };
  }, [rate, slug]);

  if (!params) return null;

  return (
    <Button
      onClick={params.onClick}
      testID={AssetsSelectors.assetItemApyButton}
      testIDProperties={{ slug, symbol, apyRate: params.rate }}
      className={classNames('ml-2 px-2 py-1', modStyles.tagBase, TAGS_CLASSNAME_RECORD[slug])}
    >
      {params.label}: {params.displayRate}%
    </Button>
  );
};
