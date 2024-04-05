import React, { FC, useMemo } from 'react';

import { ExternalLinkChip, ExternalLinkChipProps } from 'app/atoms/ExternalLinkChip';
import { t } from 'lib/i18n';
import { useExplorerBaseUrls } from 'lib/temple/front';

import { OpenInExplorerChipSelectors } from './selectors';

type Props = Omit<ExternalLinkChipProps, 'href'> & {
  tezosChainId: string;
  hash: string;
  type?: keyof ReturnType<typeof useExplorerBaseUrls>;
};

export const OpenInExplorerChip: FC<Props> = ({
  tezosChainId,
  hash,
  type = 'transaction',
  tooltip = t('viewOnBlockExplorer'),
  ...props
}) => {
  const urls = useExplorerBaseUrls(tezosChainId);

  const href = useMemo(() => {
    const baseUrl = type && urls[type];

    return baseUrl ? new URL(hash, baseUrl).href : null;
  }, [urls, hash, type]);

  if (!href) return null;

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
