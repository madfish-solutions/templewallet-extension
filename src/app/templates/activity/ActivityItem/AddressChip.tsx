import React, { FC, useMemo } from 'react';

import { HashShortView, IconBase } from 'app/atoms';
import { CopyButton } from 'app/atoms/CopyButton';
import { ReactComponent as CopySvg } from 'app/icons/base/copy.svg';
import { ActivityOperKindEnum, EvmOperation, TezosOperation } from 'lib/activity';
import { ActivityOperTransferType } from 'lib/activity/types';

interface Props {
  operation: TezosOperation | EvmOperation;
}

export const OperAddressChip: FC<Props> = ({ operation }) => {
  const info = useMemo(() => {
    if (operation.kind === ActivityOperKindEnum.approve) return { title: 'For', address: operation.spenderAddress };

    if (operation.kind === ActivityOperKindEnum.interaction)
      return operation.withAddress ? { title: 'With', address: operation.withAddress } : undefined;

    if (operation.type === ActivityOperTransferType.fromUsToAccount)
      return { title: 'To', address: operation.toAddress };

    if (operation.type === ActivityOperTransferType.toUsFromAccount)
      return { title: 'From', address: operation.fromAddress };

    if (operation.type === ActivityOperTransferType.fromUs) return { title: 'With', address: operation.toAddress };

    if (operation.type === ActivityOperTransferType.toUs) return { title: 'With', address: operation.fromAddress };

    return;
  }, [operation]);

  if (!info) return null;

  return (
    <div className="flex items-center gap-x-0.5">
      <span>{info.title}:</span>

      <CopyButton
        text={info.address}
        className="flex items-center gap-x-1 group-hover:text-secondary"
        shouldShowTooltip
      >
        <span>
          <HashShortView hash={info.address} firstCharsCount={6} lastCharsCount={4} />
        </span>

        <IconBase Icon={CopySvg} size={12} className="invisible group-hover:visible" />
      </CopyButton>
    </div>
  );
};
