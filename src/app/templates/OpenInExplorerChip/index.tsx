import React, { FC, memo } from 'react';

import { ExternalLinkChip, ExternalLinkChipProps } from 'app/atoms/ExternalLinkChip';
import { t } from 'lib/i18n';
import { BlockExplorerUrlType, useExplorerHref } from 'lib/temple/front';

import { OpenInExplorerChipSelectors } from './selectors';

interface Props extends Omit<ExternalLinkChipProps, 'href'> {
  hash: string;
  type?: BlockExplorerUrlType;
}

export const OpenInExplorerChip: FC<Props> = ({ hash, type = 'transaction', tooltip, ...props }) => {
  const href = useExplorerHref(hash, type);

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
