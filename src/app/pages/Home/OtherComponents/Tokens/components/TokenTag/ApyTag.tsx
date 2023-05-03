import React, { FC, useState, useMemo } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import type { TokenApyInfo } from 'app/hooks/use-token-apy.hook';
import { TOKENS_BRAND_COLORS } from 'lib/assets/known-tokens';
import { isTruthy, openLink } from 'lib/utils';

import { AssetsSelectors } from '../../../Assets.selectors';
import modStyles from '../../Tokens.module.css';

interface Props {
  slug: string;
  symbol: string;
  apyInfo: TokenApyInfo;
}

export const TokenApyTag: FC<Props> = ({ slug, symbol, apyInfo }) => {
  const [hovered, setHovered] = useState(false);

  const colors = useMemo(() => TOKENS_BRAND_COLORS[slug], [slug]);

  const { rate, link } = apyInfo;

  if (!isTruthy(rate) || !isTruthy(link)) return null;

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
      APY: {rate}%
    </Button>
  );
};
