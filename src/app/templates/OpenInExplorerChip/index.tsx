import React, { FC } from 'react';

import { ExternalLinkChip, ExternalLinkChipProps } from 'app/atoms/ExternalLinkChip';
import { t } from 'lib/i18n';
import { useTezosBlockExplorerUrl } from 'temple/front/block-explorers';

import { OpenInExplorerChipSelectors } from './selectors';

interface Props extends Omit<ExternalLinkChipProps, 'href'> {
  tezosChainId: string;
  hash: string;
}

export const OpenInExplorerChip: FC<Props> = ({ tezosChainId, hash, tooltip = t('viewOnBlockExplorer'), ...props }) => {
  const explorerBaseUrl = useTezosBlockExplorerUrl(tezosChainId);
  if (!explorerBaseUrl) return null;

  const href = new URL(hash, explorerBaseUrl).href;

  return (
    <ExternalLinkChip
      {...props}
      href={href}
      arrowIcon
      tooltip={tooltip}
      testID={OpenInExplorerChipSelectors.viewOnBlockExplorerLink}
    />
  );
};
