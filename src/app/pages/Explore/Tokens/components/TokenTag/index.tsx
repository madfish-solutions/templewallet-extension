import React from 'react';

import { TokenApyInfo } from 'app/store/d-apps';
import { isTezAsset } from 'lib/temple/assets';

import { TokenApyTag } from './ApyTag';
import { DelegateTezosTag } from './DelegateTag';

interface TokenTagProps {
  assetSlug: string;
  assetSymbol: string;
  apyInfo?: TokenApyInfo;
}

export const TokenTag: React.FC<TokenTagProps> = ({ assetSlug, assetSymbol, apyInfo }) => {
  if (isTezAsset(assetSlug)) return <DelegateTezosTag />;

  if (apyInfo && apyInfo.rate > 0) return <TokenApyTag slug={assetSlug} symbol={assetSymbol} apy={apyInfo} />;

  return null;
};
