import { FC } from 'react';

import clsx from 'clsx';

import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { DisplayAllTokensButton } from 'app/atoms/display-all-tokens-button';
import { EmptyState } from 'app/atoms/EmptyState';
import { TID } from 'lib/i18n';

interface Props {
  forCollectibles: boolean;
  forSearch: boolean;
  manageActive: boolean;
  shouldShowHiddenTokensHint?: boolean;
  textI18n?: TID;
  stretchSpaceBeforeButton?: boolean;
  action?: 'addCustomToken' | 'displayAllTokens';
  onAddCustomTokenClick: EmptyFn;
  onDisplayAllTokensClick?: EmptyFn;
}

export const AssetsEmptySection: FC<Props> = ({
  forCollectibles,
  forSearch,
  manageActive,
  shouldShowHiddenTokensHint = false,
  textI18n: textI18nFromProps,
  stretchSpaceBeforeButton = true,
  action = 'addCustomToken',
  onDisplayAllTokensClick,
  onAddCustomTokenClick
}) => {
  let textI18n: TID;
  if (textI18nFromProps) {
    textI18n = textI18nFromProps;
  } else if (forSearch) {
    textI18n = 'noAssetsFound';
  } else if (!forCollectibles && shouldShowHiddenTokensHint) {
    textI18n = 'hiddenTokensHint';
  } else if (forCollectibles) {
    textI18n = 'noCollectibles';
  } else {
    textI18n = 'noTokens';
  }

  const commonProps = { manageActive, onClick: onAddCustomTokenClick };
  const shouldShowAddButtonAtTop = manageActive && !forCollectibles;

  return (
    <div
      className={clsx('w-full h-full px-4 flex flex-col items-center', !stretchSpaceBeforeButton && 'justify-center')}
    >
      {shouldShowAddButtonAtTop && <AddCustomTokenButton {...commonProps} className="w-full mt-4" />}
      <EmptyState forSearch={forSearch} textI18n={textI18n} stretch={stretchSpaceBeforeButton} />
      {!shouldShowAddButtonAtTop &&
        (action === 'displayAllTokens' ? (
          <DisplayAllTokensButton onClick={onDisplayAllTokensClick} />
        ) : (
          <AddCustomTokenButton {...commonProps} className="mb-8" />
        ))}
    </div>
  );
};
