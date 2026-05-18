import { FC } from 'react';

import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { EmptyState } from 'app/atoms/EmptyState';
import { TID } from 'lib/i18n';

interface Props {
  forCollectibles: boolean;
  forSearch: boolean;
  manageActive: boolean;
  shouldShowHiddenTokensHint?: boolean;
  onAddCustomTokenClick: EmptyFn;
}

export const EmptySection: FC<Props> = ({
  forCollectibles,
  forSearch,
  manageActive,
  shouldShowHiddenTokensHint = false,
  onAddCustomTokenClick
}) => {
  let textI18n: TID;
  if (forSearch) {
    textI18n = 'noAssetsFound';
  } else if (!forCollectibles && shouldShowHiddenTokensHint) {
    textI18n = 'hiddenTokensHint';
  } else if (forCollectibles) {
    textI18n = 'noCollectibles';
  } else {
    textI18n = 'noTokens';
  }

  const commonProps = { manageActive, onClick: onAddCustomTokenClick };

  return (
    <div className="w-full h-full px-4 flex flex-col items-center">
      {manageActive && <AddCustomTokenButton {...commonProps} className="w-full mt-4" />}
      <EmptyState forSearch={forSearch} textI18n={textI18n} stretch />
      {!manageActive && <AddCustomTokenButton {...commonProps} className="mb-8" />}
    </div>
  );
};
