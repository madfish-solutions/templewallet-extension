import React, { FC, useMemo } from 'react';

import { ExternalLinkChip, ExternalLinkChipProps } from 'app/atoms/ExternalLinkChip';
import { useExplorerBaseUrls } from 'lib/temple/front';

import { OpenInExplorerChipSelectors } from './selectors';

type Props = Omit<ExternalLinkChipProps, 'href'> & {
  hash: string;
  type?: keyof ReturnType<typeof useExplorerBaseUrls>;
};

export const OpenInExplorerChip: FC<Props> = ({
  hash,
  type = 'transaction',
  tooltip = 'View on block explorer',
  ...props
}) => {
  const urls = useExplorerBaseUrls();

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
