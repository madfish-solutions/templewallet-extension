import React, { memo, useMemo } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { TezosActivity } from 'lib/activity';
import { isTransferActivityOperKind } from 'lib/activity/utils';
import { useGetChainTokenOrGasMetadata } from 'lib/metadata';
import { useBooleanState } from 'lib/ui/hooks';
import { ZERO } from 'lib/utils/numbers';
import { useExplorerHref } from 'temple/front/block-explorers';
import { TezosChain } from 'temple/front/chains';

import { ActivityOperationBaseComponent } from './ActivityOperationBase';
import { BundleModalContent } from './BundleModal';
import { InteractionsConnector } from './InteractionsConnector';
import { TezosActivityOperationComponent, buildTezosOperationAsset } from './TezosActivityOperation';

interface Props {
  activity: TezosActivity;
  chain: TezosChain;
  assetSlug?: string;
}

export const TezosActivityComponent = memo<Props>(({ activity, chain, assetSlug }) => {
  const { hash, operations, status, operationsCount } = activity;

  const blockExplorerUrl = useExplorerHref(chain.chainId, hash) ?? undefined;

  if (operationsCount === 1) {
    const operation = operations.at(0);

    return (
      <TezosActivityOperationComponent
        hash={hash}
        operation={operation}
        chainId={chain.chainId}
        blockExplorerUrl={blockExplorerUrl}
        status={status}
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

  const { hash, operations, status } = activity;

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
    <>
      <ActivityOperationBaseComponent
        kind="bundle"
        hash={hash}
        chainId={chainId}
        asset={batchAsset}
        status={status}
        blockExplorerUrl={blockExplorerUrl}
        withoutAssetIcon={Boolean(assetSlug)}
        onClick={toggleExpanded}
      />

      <PageModal title="Bundle" opened={expanded} onRequestClose={toggleExpanded}>
        {() => (
          <BundleModalContent blockExplorerUrl={blockExplorerUrl}>
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
          </BundleModalContent>
        )}
      </PageModal>
    </>
  );
});
