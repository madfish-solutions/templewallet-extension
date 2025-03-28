import React, { memo, useMemo } from 'react';

import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { EmptyState } from 'app/atoms/EmptyState';
import { TID } from 'lib/i18n';
import { OneOfChains } from 'temple/front';

interface Props {
  forCollectibles: boolean;
  forSearch: boolean;
  manageActive: boolean;
  network?: OneOfChains;
}

export const EmptySection = memo<Props>(({ forCollectibles, forSearch, manageActive, network }) => {
  const textI18n = useMemo<TID>(
    () => (forSearch ? 'noAssetsFound' : forCollectibles ? 'noCollectibles' : 'noTokens'),
    [forCollectibles, forSearch]
  );

  const commonProps = {
    forCollectibles,
    manageActive,
    network
  };

  return (
    <div className="w-full h-full px-4 flex flex-col items-center">
      {manageActive && <AddCustomTokenButton {...commonProps} className="w-full mt-4" />}
      <EmptyState forSearch={forSearch} textI18n={textI18n} stretch />
      {!manageActive && <AddCustomTokenButton {...commonProps} className="mb-8" />}
    </div>
  );
});
