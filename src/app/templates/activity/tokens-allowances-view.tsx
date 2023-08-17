import React, { FC, useMemo } from 'react';

import { Allowance } from '@temple-wallet/transactions-parser';

import { t } from 'lib/i18n';
import { useManyAssetsMetadata } from 'lib/metadata';

import { getAssetSymbolOrName } from './get-asset-symbol-or-name';

interface Props {
  allowancesChanges: Allowance[];
}

export const TokensAllowancesView: FC<Props> = ({ allowancesChanges }) => {
  const assetsSlugs = useMemo(() => allowancesChanges.map(({ tokenSlug }) => tokenSlug), [allowancesChanges]);
  const assetsMetadata = useManyAssetsMetadata(assetsSlugs);
  const firstAssetSymbolOrName = getAssetSymbolOrName(assetsMetadata[assetsSlugs[0]]);

  return (
    <span className="text-sm text-gray-910 font-medium leading-tight">
      {assetsSlugs.length <= 2 &&
        assetsSlugs.map(slug => getAssetSymbolOrName(assetsMetadata[slug])).join(t('listSeparation'))}
      {assetsSlugs.length > 2 && t('tokenAndSeveralOthers', [firstAssetSymbolOrName, assetsSlugs.length - 1])}
    </span>
  );
};
