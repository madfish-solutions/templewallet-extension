import React, { memo, useMemo } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { ReactComponent as CompactDownIcon } from 'app/icons/base/compact_down.svg';
import { ActivityOperKindEnum, EvmActivity } from 'lib/activity';
import { EvmActivityAsset } from 'lib/activity/types';
import { isTransferActivityOperKind } from 'lib/activity/utils';
import { toEvmAssetSlug } from 'lib/assets/utils';
import { t } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { ZERO } from 'lib/utils/numbers';
import { EvmChain } from 'temple/front/chains';

import { ActivityItemBaseAssetProp, ActivityOperationBaseComponent } from './ActivityOperationBase';
import { InteractionsConnector } from './InteractionsConnector';

interface Props {
  activity: EvmActivity;
  chain: EvmChain;
  assetSlug?: string;
}

export const EvmActivityComponent = memo<Props>(({ activity, chain, assetSlug }) => {
  const networkName = chain.nameI18nKey ? t(chain.nameI18nKey) : chain.name;

  const { hash, blockExplorerUrl } = activity;

  const operations = activity.operations;

  if (activity.operationsCount === 1) {
    const operation = operations.at(0);

    return (
      <ActivityOperationBaseComponent
        kind={operation?.kind ?? ActivityOperKindEnum.interaction}
        hash={hash}
        chainId={chain.chainId}
        networkName={networkName}
        asset={operation?.asset}
        blockExplorerUrl={blockExplorerUrl}
        withoutAssetIcon={Boolean(assetSlug)}
      />
    );
  }

  return (
    <EvmActivityBatchComponent
      activity={activity}
      chainId={chain.chainId}
      assetSlug={assetSlug}
      blockExplorerUrl={blockExplorerUrl}
      networkName={networkName}
    />
  );
});

interface BatchProps {
  activity: EvmActivity;
  chainId: number;
  assetSlug?: string;
  blockExplorerUrl?: string;
  networkName: string;
}

const EvmActivityBatchComponent = memo<BatchProps>(
  ({ activity, chainId, assetSlug, blockExplorerUrl, networkName }) => {
    const [expanded, , , toggleExpanded] = useBooleanState(false);

    const { hash, operations } = activity;

    const faceSlug = useMemo(() => {
      if (assetSlug) return assetSlug;

      for (const { kind, asset } of operations) {
        if (typeof asset?.amount === 'string' && Number(asset.amount) !== 0 && isTransferActivityOperKind(kind))
          return toEvmAssetSlug(asset.contract, asset.tokenId);
      }

      return;
    }, [operations, assetSlug]);

    const batchAsset = useMemo(() => {
      if (!faceSlug) return;

      let faceAsset: EvmActivityAsset | undefined;
      let faceAmount = ZERO;

      for (const { kind, asset } of operations) {
        if (
          typeof asset?.amount === 'string' &&
          toEvmAssetSlug(asset.contract, asset.tokenId) === faceSlug &&
          isTransferActivityOperKind(kind)
        ) {
          faceAmount = faceAmount.plus(asset.amount);
          if (!faceAsset) faceAsset = asset;
        }
      }

      if (!faceAsset) return;

      const batchAsset: ActivityItemBaseAssetProp = {
        ...faceAsset,
        amount: faceAmount.toFixed()
      };

      return batchAsset;
    }, [operations, faceSlug]);

    return (
      <div className="flex flex-col">
        <ActivityOperationBaseComponent
          kind="bundle"
          hash={hash}
          chainId={chainId}
          networkName={networkName}
          asset={batchAsset}
          blockExplorerUrl={blockExplorerUrl}
          withoutAssetIcon={Boolean(assetSlug)}
        />

        <button
          className="ml-2 mt-1 mb-2 flex px-1 py-0.5 text-font-description-bold text-grey-1" // TODO: DRY
          onClick={toggleExpanded}
        >
          <span>{(expanded ? 'Hide all' : 'Show all') + ` (${operations.length})`}</span>

          <IconBase Icon={CompactDownIcon} size={12} className={clsx('text-grey-2', expanded && 'rotate-180')} />
        </button>

        {expanded
          ? operations.map((operation, j) => (
              <React.Fragment key={`${hash}-${j}`}>
                {j > 0 && <InteractionsConnector />}

                <ActivityOperationBaseComponent
                  kind={operation.kind}
                  hash={hash}
                  chainId={chainId}
                  networkName={networkName}
                  asset={operation.asset}
                  blockExplorerUrl={blockExplorerUrl}
                />
              </React.Fragment>
            ))
          : null}
      </div>
    );
  }
);
