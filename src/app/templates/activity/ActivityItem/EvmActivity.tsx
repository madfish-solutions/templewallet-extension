import React, { memo, useMemo } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { PageModal } from 'app/atoms/PageModal';
import { ReactComponent as CompactDownIcon } from 'app/icons/base/compact_down.svg';
import { EvmActivity } from 'lib/activity';
import { EvmActivityAsset } from 'lib/activity/types';
import { getAssetSymbol, isTransferActivityOperKind } from 'lib/activity/utils';
import { fromAssetSlug, toEvmAssetSlug } from 'lib/assets/utils';
import { t } from 'lib/i18n';
import { useGetEvmChainAssetMetadata } from 'lib/metadata';
import { useBooleanState } from 'lib/ui/hooks';
import { ZERO } from 'lib/utils/numbers';
import { EvmChain } from 'temple/front/chains';

import { ActivityItemBaseAssetProp, ActivityOperationBaseComponent } from './ActivityOperationBase';
import { EvmActivityOperationComponent } from './EvmActivityOperation';
import { InteractionsConnector } from './InteractionsConnector';

interface Props {
  activity: EvmActivity;
  chain: EvmChain;
  assetSlug?: string;
}

export const EvmActivityComponent = memo<Props>(({ activity, chain, assetSlug }) => {
  const networkName = chain.nameI18nKey ? t(chain.nameI18nKey) : chain.name;

  const { hash, operations, operationsCount, blockExplorerUrl } = activity;

  if (operationsCount === 1) {
    const operation = operations.at(0);

    return (
      <EvmActivityOperationComponent
        hash={hash}
        operation={operation}
        chainId={chain.chainId}
        networkName={networkName}
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

    const getMetadata = useGetEvmChainAssetMetadata(chainId);

    const faceSlug = useMemo(() => {
      if (assetSlug) return assetSlug;

      for (const { kind, asset } of operations) {
        if (asset?.amount && Number(asset.amount) !== 0 && isTransferActivityOperKind(kind)) {
          const slug = toEvmAssetSlug(asset.contract, asset.tokenId);

          const decimals = getMetadata(slug)?.decimals ?? asset.decimals;

          if (decimals != null) return slug;
        }
      }

      return;
    }, [getMetadata, operations, assetSlug]);

    const batchAsset = useMemo<ActivityItemBaseAssetProp | undefined>(() => {
      if (!faceSlug) return;

      let faceAssetBase: EvmActivityAsset | undefined;
      let faceAmount = ZERO;

      for (const { kind, asset } of operations) {
        if (
          isTransferActivityOperKind(kind) &&
          asset?.amount &&
          toEvmAssetSlug(asset.contract, asset.tokenId) === faceSlug
        ) {
          faceAmount = faceAmount.plus(asset.amount);
          if (!faceAssetBase) faceAssetBase = asset;
        }
      }

      const assetMetadata = getMetadata(faceSlug);

      const decimals = assetMetadata?.decimals ?? faceAssetBase?.decimals;

      if (decimals == null) return;

      const symbol = getAssetSymbol(assetMetadata) || faceAssetBase?.symbol;

      const [contract, tokenId] = fromAssetSlug(faceSlug);

      return {
        ...faceAssetBase,
        contract,
        tokenId,
        amount: faceAmount.toFixed(),
        decimals,
        symbol
      };
    }, [getMetadata, operations, faceSlug]);

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

        <PageModal title="Bundle" opened={expanded} onRequestClose={toggleExpanded}>
          <div className="flex-grow flex flex-col overflow-y-auto p-4 pb-15">
            {operations.map((operation, j) => (
              <React.Fragment key={`${hash}-${j}`}>
                {j > 0 && <InteractionsConnector />}

                <EvmActivityOperationComponent
                  hash={hash}
                  operation={operation}
                  chainId={chainId}
                  networkName={networkName}
                  blockExplorerUrl={blockExplorerUrl}
                />
              </React.Fragment>
            ))}
          </div>
        </PageModal>
      </div>
    );
  }
);
