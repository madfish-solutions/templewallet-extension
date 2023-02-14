import React from 'react';

import { TokenApyInfo } from 'app/hooks/use-token-apy.hook';
import { isTezAsset } from 'lib/temple/assets';
import { isTruthy } from 'lib/utils';

import { TokenApyTag } from './ApyTag';
import { DelegateTezosTag } from './DelegateTag';

interface TokenTagProps {
  assetSlug: string;
  assetSymbol: string;
  apyInfo?: TokenApyInfo;
}

export const TokenTag: React.FC<TokenTagProps> = ({ assetSlug, assetSymbol, apyInfo }) => {
  if (isTezAsset(assetSlug)) return <DelegateTezosTag />;

  if (isTruthy(apyInfo)) return <TokenApyTag slug={assetSlug} symbol={assetSymbol} apyInfo={apyInfo} />;

  return null;
};
