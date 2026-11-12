import React, { memo, useMemo } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { EvmActivity } from 'lib/activity';
import { useGetEvmChainAssetMetadata } from 'lib/metadata';
import { useBooleanState, useMemoWithCompare } from 'lib/ui/hooks';
import { BasicEvmChain } from 'temple/front/chains';
import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';
import { makeBlockExplorerHref } from 'temple/front/use-block-explorers';
import { TempleChainKind } from 'temple/types';

import { ActivityItemBaseAssetProp, ActivityOperationBaseComponent } from './ActivityOperationBase';
import { BundleModalContent } from './BundleModal';
import { EvmActivityOperationComponent, buildEvmOperationAsset } from './EvmActivityOperation';
import { getEvmBundleFace, getEvmNftTransfersCount } from './utils';

interface Props {
  activity: EvmActivity;
  chain: BasicEvmChain;
  assetSlug?: string;
}

export const EvmActivityComponent = memo<Props>(({ activity, chain, assetSlug }) => {
  const { hash, operations, operationsCount, status } = activity;

  const getEvmActiveBlockExplorer = useGetEvmActiveBlockExplorer();

  const blockExplorerUrl = useMemo(() => {
    const blockExplorerBaseUrl = getEvmActiveBlockExplorer(String(chain.chainId))?.url;
    if (!blockExplorerBaseUrl) return;

    return makeBlockExplorerHref(blockExplorerBaseUrl, hash, 'tx', TempleChainKind.EVM);
  }, [getEvmActiveBlockExplorer, hash, chain.chainId]);

  if (operationsCount === 1) {
    const operation = operations.at(0);

    return (
      <EvmActivityOperationComponent
        hash={hash}
        operation={operation}
        chain={chain}
        blockExplorerUrl={blockExplorerUrl}
        status={status}
        withoutAssetIcon={Boolean(assetSlug)}
      />
    );
  }

  return (
    <EvmActivityBatchComponent
      activity={activity}
      chain={chain}
      assetSlug={assetSlug}
      blockExplorerUrl={blockExplorerUrl}
    />
  );
});

interface BatchProps {
  activity: EvmActivity;
  chain: BasicEvmChain;
  assetSlug?: string;
  blockExplorerUrl?: string;
}

const EvmActivityBatchComponent = memo<BatchProps>(({ activity, chain, assetSlug, blockExplorerUrl }) => {
  const [expanded, , , toggleExpanded] = useBooleanState(false);

  const { hash, operations, status } = activity;

  const getMetadata = useGetEvmChainAssetMetadata(chain.chainId);

  const batchAsset = useMemoWithCompare<ActivityItemBaseAssetProp | undefined>(() => {
    const face = getEvmBundleFace(operations, assetSlug, (slug, asset) =>
      Boolean(buildEvmOperationAsset(asset, getMetadata(slug)))
    );

    if (!face) return;

    const { slug, asset, amountSigned } = face;

    if (asset.nft) {
      const count = getEvmNftTransfersCount(operations);

      return {
        ...asset,
        amountSigned: amountSigned.startsWith('-') ? `-${count}` : String(count),
        decimals: 0,
        symbol: 'NFT'
      };
    }

    return buildEvmOperationAsset({ ...asset, amountSigned }, getMetadata(slug));
  }, [getMetadata, operations, assetSlug]);

  return (
    <>
      <ActivityOperationBaseComponent
        kind="bundle"
        hash={hash}
        chain={chain}
        asset={batchAsset}
        blockExplorerUrl={blockExplorerUrl}
        status={status}
        withoutAssetIcon={Boolean(assetSlug)}
        onClick={toggleExpanded}
      />

      <PageModal title="Bundle" opened={expanded} onRequestClose={toggleExpanded} shouldChangeBottomShift={false}>
        {() => (
          <BundleModalContent addedAt={activity.addedAt} blockExplorerUrl={blockExplorerUrl}>
            {operations.map((operation, j) => (
              <EvmActivityOperationComponent
                key={`${hash}-${j}`}
                hash={hash}
                operation={operation}
                chain={chain}
                blockExplorerUrl={blockExplorerUrl}
                withoutOperHashChip
              />
            ))}
          </BundleModalContent>
        )}
      </PageModal>
    </>
  );
});
