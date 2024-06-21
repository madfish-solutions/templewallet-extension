import React, { FC, memo } from 'react';

import { ExternalLinkChip, ExternalLinkChipProps } from 'app/atoms/ExternalLinkChip';
import { t } from 'lib/i18n';
import { useExplorerHref } from 'temple/front/block-explorers';

import { OpenInExplorerChipSelectors } from './selectors';

interface Props extends Omit<ExternalLinkChipProps, 'href'> {
  tezosChainId: string;
  hash: string;
}

export const OpenInExplorerChip: FC<Props> = ({ tezosChainId, hash, tooltip, ...props }) => {
  const href = useExplorerHref(tezosChainId, hash);

  return href ? <OpenInExplorerChipBase {...props} href={href} tooltip={tooltip} /> : null;
};

export const OpenInExplorerChipBase = memo<ExternalLinkChipProps>(({ href, tooltip, ...props }) => (
  <ExternalLinkChip
    {...props}
    href={href}
    arrowIcon
    tooltip={tooltip ?? t('viewOnBlockExplorer')}
    testID={OpenInExplorerChipSelectors.viewOnBlockExplorerLink}
  />
));
