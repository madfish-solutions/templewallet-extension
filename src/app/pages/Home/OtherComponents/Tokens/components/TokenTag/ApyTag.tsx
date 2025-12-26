import React, { FC, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { TagButton } from 'app/atoms/TagButton';
import { useTokenApyRateSelector } from 'app/store/d-apps';
import { KNOWN_TOKENS_SLUGS } from 'lib/assets/known-tokens';
import { openLink } from 'lib/utils';

import { AssetsSelectors } from '../../../Assets.selectors';

interface Props {
  slug: string;
  symbol: string;
}

const APR = 'APR';
const APY = 'APY';

const YOUVES_TOKENS_WITH_APR = [KNOWN_TOKENS_SLUGS.UUSD, KNOWN_TOKENS_SLUGS.UBTC, KNOWN_TOKENS_SLUGS.YOU];

const YOUVES_LINK = 'https://app.youves.com/earn';

const TOKEN_APY_LINKS: OptionalRecord = {
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

    return { rate, displayRate, label, onClick, link };
  }, [rate, slug]);

  if (!params) return null;

  return (
    <TagButton
      onClick={params.onClick}
      testID={AssetsSelectors.assetItemApyButton}
      testIDProperties={{ slug, symbol, apyRate: params.rate, link: params.link }}
    >
      {params.label}: {params.displayRate}%
    </TagButton>
  );
};
