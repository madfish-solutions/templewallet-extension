import React, { FC, useState, useMemo } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { TokenApyInfo } from 'app/store/d-apps';
import { T } from 'lib/i18n';
import { TOKENS_BRAND_COLORS, isTezAsset } from 'lib/temple/assets';
import { openLink } from 'lib/utils';
import { navigate } from 'lib/woozie';

import { AssetsSelectors } from '../../Assets.selectors';
import modStyles from '../Tokens.module.css';

interface TokenTagProps {
  assetSlug: string;
  assetSymbol: string;
  apyInfo?: TokenApyInfo;
}

export const TokenTag: React.FC<TokenTagProps> = ({ assetSlug, assetSymbol, apyInfo }) => {
  if (isTezAsset(assetSlug)) return <DelegateTezosTag />;

  if (apyInfo && apyInfo.rate > 0) return <TokenYieldTag slug={assetSlug} symbol={assetSymbol} apy={apyInfo} />;

  return null;
};

const DelegateTezosTag: FC = () => (
  <Button
    onClick={e => {
      e.preventDefault();
      e.stopPropagation();
      navigate('/explore/tez/?tab=delegation');
    }}
    className={classNames('ml-2 px-2 py-1', modStyles['yieldTag'])}
  >
    <T id="delegate" />
  </Button>
);

interface TokenYieldTagProps {
  slug: string;
  symbol: string;
  apy: TokenApyInfo;
}

const TokenYieldTag: FC<TokenYieldTagProps> = ({ slug, symbol, apy }) => {
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
