import React, { FC, useState, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import type { TokenApyInfo } from 'app/hooks/use-token-apy.hook';
import { KNOWN_TOKENS_SLUGS, TOKENS_BRAND_COLORS } from 'lib/assets/known-tokens';
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

export const TokenApyTag: FC<Props> = ({ slug, symbol, apyInfo }) => {
  const [hovered, setHovered] = useState(false);

  const colors = useMemo(() => TOKENS_BRAND_COLORS[slug], [slug]);

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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      testID={AssetsSelectors.assetItemApyButton}
      testIDProperties={{ slug, symbol, apyRate: rate }}
      className={classNames('ml-2 px-2 py-1', modStyles['apyTag'])}
      style={{ backgroundColor: hovered ? colors.bgHover : colors.bg }}
    >
      {label}: {displayRate}%
    </Button>
  );
};
