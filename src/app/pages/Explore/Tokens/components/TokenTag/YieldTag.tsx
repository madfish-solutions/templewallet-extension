import React, { FC, useState, useMemo } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { TokenApyInfo } from 'app/store/d-apps';
import { TOKENS_BRAND_COLORS } from 'lib/temple/assets';
import { openLink } from 'lib/utils';

import { AssetsSelectors } from '../../../Assets.selectors';
import modStyles from '../../Tokens.module.css';

interface Props {
  slug: string;
  symbol: string;
  apy: TokenApyInfo;
}

export const TokenYieldTag: FC<Props> = ({ slug, symbol, apy }) => {
  const [hovered, setHovered] = useState(false);

  const colors = useMemo(() => TOKENS_BRAND_COLORS[slug], [slug]);

  return (
    <Button
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        openLink(apy.link);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      testID={AssetsSelectors.AssetItemYieldButton}
      testIDProperties={{ slug, symbol, apyRate: apy.rate }}
      className={classNames('ml-2 px-2 py-1', modStyles['yieldTag'])}
      style={{ backgroundColor: hovered ? colors.bgHover : colors.bg }}
    >
      APY: {apy.rate}%
    </Button>
  );
};
