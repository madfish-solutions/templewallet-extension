import React, { memo, useMemo } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { PageModal } from 'app/atoms/PageModal';
import { ReactComponent as CompactDownIcon } from 'app/icons/base/compact_down.svg';
import { TezosActivity } from 'lib/activity';
import { isTransferActivityOperKind } from 'lib/activity/utils';
import { useGetChainTokenOrGasMetadata } from 'lib/metadata';
import { useBooleanState } from 'lib/ui/hooks';
import { ZERO } from 'lib/utils/numbers';
import { useExplorerHref } from 'temple/front/block-explorers';
import { TezosChain } from 'temple/front/chains';

import { ActivityOperationBaseComponent } from './ActivityOperationBase';
import { InteractionsConnector } from './InteractionsConnector';
import { TezosActivityOperationComponent, buildTezosOperationAsset } from './TezosActivityOperation';

interface Props {
  activity: TezosActivity;
  chain: TezosChain;
  assetSlug?: string;
}

export const TezosActivityComponent = memo<Props>(({ activity, chain, assetSlug }) => {
  const { hash, operations, operationsCount } = activity;

  const blockExplorerUrl = useExplorerHref(chain.chainId, hash) ?? undefined;

  if (operationsCount === 1) {
    const operation = operations.at(0);

    return (
      <TezosActivityOperationComponent
        hash={hash}
        operation={operation}
        chainId={chain.chainId}
        blockExplorerUrl={blockExplorerUrl}
        withoutAssetIcon={Boolean(assetSlug)}
      />
    );
  }

  return (
    <TezosActivityBatchComponent
      activity={activity}
      chainId={chain.chainId}
      assetSlug={assetSlug}
      blockExplorerUrl={blockExplorerUrl}
    />
  );
});

interface BatchProps {
  activity: TezosActivity;
  chainId: string;
  assetSlug?: string;
  blockExplorerUrl?: string;
}

const TezosActivityBatchComponent = memo<BatchProps>(({ activity, chainId, assetSlug, blockExplorerUrl }) => {
  const [expanded, , , toggleExpanded] = useBooleanState(false);

  const { hash, operations } = activity;

  const getMetadata = useGetChainTokenOrGasMetadata(chainId);

  const batchAsset = useMemo(() => {
    const faceSlug =
      assetSlug ||
      operations.find(
        ({ kind, assetSlug, amountSigned }) =>
          assetSlug &&
          amountSigned &&
          Number(amountSigned) !== 0 &&
          isTransferActivityOperKind(kind) &&
          getMetadata(assetSlug)
      )?.assetSlug;

    if (!faceSlug) return;

    let faceAmount = ZERO;

    for (const { kind, assetSlug, amountSigned } of operations) {
      if (assetSlug === faceSlug && amountSigned && isTransferActivityOperKind(kind))
        faceAmount = faceAmount.plus(amountSigned);
    }

    return buildTezosOperationAsset(faceSlug, getMetadata(faceSlug), faceAmount.toFixed());
  }, [getMetadata, operations, assetSlug]);

  return (
    <div className="flex flex-col">
      <ActivityOperationBaseComponent
        kind="bundle"
        hash={hash}
        chainId={chainId}
        asset={batchAsset}
        blockExplorerUrl={blockExplorerUrl}
        withoutAssetIcon={Boolean(assetSlug)}
      />

      <button
        className="ml-2 mt-1 mb-2 flex px-1 py-0.5 text-font-description-bold text-grey-1"
        onClick={toggleExpanded}
      >
        <span>{(expanded ? 'Hide all' : 'Show all') + ` (${operations.length})`}</span>

        <IconBase Icon={CompactDownIcon} size={12} className={clsx('text-grey-2', expanded && 'rotate-180')} />
      </button>

      <PageModal title="Bundle" opened={expanded} onRequestClose={toggleExpanded}>
        <div className="flex-grow flex flex-col overflow-y-auto p-4 pb-15">
          {operations.map((operation, j) => (
            <React.Fragment key={`${hash}-${j}`}>
              {j > 0 && <InteractionsConnector />}

              <TezosActivityOperationComponent
                hash={hash}
                operation={operation}
                chainId={chainId}
                blockExplorerUrl={blockExplorerUrl}
              />
            </React.Fragment>
          ))}
        </div>
      </PageModal>
    </div>
  );
});
