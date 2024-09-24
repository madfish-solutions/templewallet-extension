import React, { memo, useMemo } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { ReactComponent as CompactDownIcon } from 'app/icons/base/compact_down.svg';
import { TezosActivityAsset, parseTezosPreActivityOperation } from 'lib/activity';
import { TezosPreActivity } from 'lib/activity/tezos/types';
import { isTransferActivityOperKind } from 'lib/activity/utils';
import { toTezosAssetSlug } from 'lib/assets/utils';
import { t } from 'lib/i18n';
import { useGetChainTokenOrGasMetadata } from 'lib/metadata';
import { useBooleanState, useMemoWithCompare } from 'lib/ui/hooks';
import { ZERO } from 'lib/utils/numbers';
import { useExplorerHref } from 'temple/front/block-explorers';
import { TezosChain } from 'temple/front/chains';

import { ActivityItemBaseAssetProp, ActivityOperationBaseComponent } from './ActivityOperationBase';
import { InteractionsConnector } from './InteractionsConnector';
import { TezosActivityOperationComponent } from './TezosActivityOperation';

interface Props {
  activity: TezosPreActivity;
  chain: TezosChain;
  accountAddress: string;
  assetSlug?: string;
}

export const TezosActivityComponent = memo<Props>(({ activity, chain, accountAddress, assetSlug }) => {
  const networkName = chain.nameI18nKey ? t(chain.nameI18nKey) : chain.name;

  const { hash, operations } = activity;

  const blockExplorerUrl = useExplorerHref(chain.chainId, hash) ?? undefined;

  if (operations.length === 1)
    return (
      <TezosActivityOperationComponent
        hash={hash}
        operation={operations[0]!}
        chainId={chain.chainId}
        networkName={networkName}
        blockExplorerUrl={blockExplorerUrl}
        accountAddress={accountAddress}
        withoutAssetIcon={Boolean(assetSlug)}
      />
    );

  return (
    <TezosActivityBatchComponent
      activity={activity}
      chainId={chain.chainId}
      assetSlug={assetSlug}
      blockExplorerUrl={blockExplorerUrl}
      accountAddress={accountAddress}
      networkName={networkName}
    />
  );
});

const TezosActivityBatchComponent = memo<{
  activity: TezosPreActivity;
  chainId: string;
  assetSlug?: string;
  blockExplorerUrl?: string;
  accountAddress: string;
  networkName: string;
}>(({ activity, chainId, assetSlug, blockExplorerUrl, accountAddress, networkName }) => {
  const [expanded, , , toggleExpanded] = useBooleanState(false);

  const { hash } = activity;

  const preOperations = activity.operations;

  const getMetadata = useGetChainTokenOrGasMetadata(chainId);

  const operations = useMemoWithCompare(
    () =>
      preOperations.map(o => {
        const slug = o.contract ? toTezosAssetSlug(o.contract, o.tokenId) : undefined;
        return parseTezosPreActivityOperation(o, accountAddress, slug ? getMetadata(slug) : undefined);
      }),
    [preOperations, getMetadata, accountAddress]
  );

  const faceSlug = useMemo(() => {
    if (assetSlug) return assetSlug;

    for (const { kind, asset } of operations) {
      if (typeof asset?.amount === 'string' && Number(asset.amount) !== 0 && isTransferActivityOperKind(kind))
        return toTezosAssetSlug(asset.contract, asset.tokenId);
    }

    return;
  }, [operations, assetSlug]);

  const batchAsset = useMemo(() => {
    if (!faceSlug) return;

    let faceAsset: TezosActivityAsset | undefined;
    let faceAmount = ZERO;

    for (const { kind, asset } of operations) {
      if (
        typeof asset?.amount === 'string' &&
        toTezosAssetSlug(asset.contract, asset.tokenId) === faceSlug &&
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
        className="ml-2 mt-1 mb-2 flex px-1 py-0.5 text-font-description-bold text-grey-1"
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
});
