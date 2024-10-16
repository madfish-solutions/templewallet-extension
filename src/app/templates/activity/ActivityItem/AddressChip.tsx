import React, { FC, useMemo } from 'react';

import { HashShortView, IconBase } from 'app/atoms';
import { CopyButton } from 'app/atoms/CopyButton';
import { ReactComponent as CopySvg } from 'app/icons/base/copy.svg';
import { ActivityOperKindEnum, EvmOperation, TezosOperation, ActivityOperTransferType } from 'lib/activity';

interface Props {
  operation: TezosOperation | EvmOperation;
}

export const OperAddressChip: FC<Props> = ({ operation }) => {
  const info = useMemo(() => {
    switch (operation.kind) {
      case ActivityOperKindEnum.approve:
        return { title: 'For', address: operation.spenderAddress };
      case ActivityOperKindEnum.interaction:
        return operation.withAddress ? { title: 'With', address: operation.withAddress } : undefined;
    }

    switch (operation.type) {
      case ActivityOperTransferType.sendToAccount:
        return { title: 'To', address: operation.toAddress };
      case ActivityOperTransferType.receiveFromAccount:
        return { title: 'From', address: operation.fromAddress };
      case ActivityOperTransferType.send:
        return { title: 'With', address: operation.toAddress };
      case ActivityOperTransferType.receive:
        return { title: 'With', address: operation.fromAddress };
    }
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
