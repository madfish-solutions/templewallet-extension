import { FC } from 'react';

import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { EmptyState } from 'app/atoms/EmptyState';
import { TID } from 'lib/i18n';
import { OneOfChains } from 'temple/front';

interface Props {
  forCollectibles: boolean;
  forSearch: boolean;
  manageActive: boolean;
  network?: OneOfChains;
  shouldShowHiddenTokensHint?: boolean;
}

export const AssetsEmptySection: FC<Props> =
  ({ forCollectibles, forSearch, manageActive, network, shouldShowHiddenTokensHint = false }) => {
    let textI18n: TID;
    if (forSearch) {
      textI18n = 'noAssetsFound';
    } else if (!forCollectibles && shouldShowHiddenTokensHint) {
      textI18n = 'hiddenTokensHint';
    } else {
      textI18n = forCollectibles ? 'noCollectibles' : 'noTokens';
    }

    const commonProps = {
      forCollectibles,
      manageActive,
      network
    };

    return (
      <div className="w-full h-full px-4 flex flex-col items-center justify-center">
        {manageActive && <AddCustomTokenButton {...commonProps} className="w-full mt-4" />}
        <EmptyState forSearch={forSearch} textI18n={textI18n} />
        {!manageActive && <AddCustomTokenButton {...commonProps} className="mb-8" />}
      </div>
    );
  };
