import React, { FC, memo } from 'react';

import clsx from 'clsx';

import { IconBase, SyncSpinner } from 'app/atoms';
import { EmptyState } from 'app/atoms/EmptyState';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { ReactComponent as CompactDownIcon } from 'app/icons/base/compact_down.svg';
import { ContentContainer } from 'app/layouts/containers';
import { useChainSelectController, ChainSelectSection } from 'app/templates/ChainSelect';
import { getEvmTransactions } from 'lib/apis/temple/endpoints/evm';
import { t } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { useBooleanState } from 'lib/ui/hooks';
import { useAccountAddressForEvm } from 'temple/front';
import { OneOfChains, useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { ActivityItemBaseComponent } from './ActivityItemBase';
import { ReactComponent as InteractionsConnectorSvg } from './interactions-connector.svg';
import { TezosActivityTab } from './tezos';
import { Activity, EvmOperation, parseGoldRushTransaction } from './utils';

export { TezosActivityTab };

export const ActivityWithChainSelect = memo(() => {
  const chainSelectController = useChainSelectController();
  const network = chainSelectController.value;

  return (
    <>
      <div className="h-3" />

      <ContentContainer>
        <ChainSelectSection controller={chainSelectController} />

        {network.kind === 'tezos' ? (
          <TezosActivityTab tezosChainId={network.chainId} />
        ) : (
          <EvmActivityTab chainId={network.chainId} />
        )}
      </ContentContainer>
    </>
  );
});

interface EvmActivityTabProps {
  chainId: number;
  assetSlug?: string;
}

export const EvmActivityTab: FC<EvmActivityTabProps> = ({ chainId, assetSlug }) => {
  const network = useEvmChainByChainId(chainId);
  const accountAddress = useAccountAddressForEvm();

  if (!network || !accountAddress) throw new DeadEndBoundaryError();

  const { data, isLoading: isSyncing } = useTypedSWR(['evm-activity-history', chainId, accountAddress], async () => {
    return await getEvmTransactions(accountAddress, chainId, 0);
  });

  console.log('Data:', data);

  console.log(1, data?.items.length);
  console.log(2, new Set(data?.items.map(item => item.tx_hash)).size);

  const activities = data?.items.map<Activity>(item => parseGoldRushTransaction(item, chainId, accountAddress)) ?? [];

  return (
    <div className="flex flex-col">
      {activities.length ? (
        <>
          {activities.map(activity => (
            <ActivityComponent key={activity.hash} activity={activity} chain={network} />
          ))}

          {isSyncing && <SyncSpinner className="mt-4" />}
        </>
      ) : isSyncing ? (
        <SyncSpinner className="mt-4" />
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

const ActivityComponent: FC<{ activity: Activity; chain: OneOfChains }> = ({ activity, chain }) => {
  if (activity.chain !== TempleChainKind.EVM) throw new Error('Tezos activities in dev');

  const [expanded, , , toggleExpanded] = useBooleanState(false);

  const networkName = chain.nameI18nKey ? t(chain.nameI18nKey) : chain.name;

  const { hash, blockExplorerUrl } = activity;

  const operations = activity.operations as EvmOperation[];

  return (
    <div className="flex flex-col">
      {operations.slice(0, 3).map((operation, i) => (
        <React.Fragment key={`${hash}-${i}`}>
          {i > 0 && <InteractionsConnector />}

          <ActivityItemBaseComponent
            key={`${hash}-${i}`}
            kind={operation.kind}
            hash={hash}
            chainId={chain.chainId}
            networkName={networkName}
            asset={operation.asset}
            blockExplorerUrl={blockExplorerUrl}
          />
        </React.Fragment>
      ))}

      {operations.length > 3 ? (
        <>
          <button
            className="ml-2 mt-1 mb-2 flex px-1 py-0.5 text-font-description-bold text-grey-1"
            onClick={toggleExpanded}
          >
            <span>{expanded ? 'Show less' : 'Show more'}</span>

            <IconBase Icon={CompactDownIcon} size={12} className={clsx('text-grey-2', expanded && 'rotate-180')} />
          </button>

          {expanded
            ? operations.slice(3).map((operation, j) => (
                <React.Fragment key={`${hash}-${j}`}>
                  {j > 0 && <InteractionsConnector />}

                  <ActivityItemBaseComponent
                    kind={operation.kind}
                    hash={hash}
                    chainId={chain.chainId}
                    networkName={networkName}
                    asset={operation.asset}
                    blockExplorerUrl={blockExplorerUrl}
                  />
                </React.Fragment>
              ))
            : null}
        </>
      ) : null}
    </div>
  );
};

const InteractionsConnector = memo(() => (
  <div className="z-0 h-0 overflow-visible pl-7">
    <InteractionsConnectorSvg className="h-4 text-grey-3 fill-current stroke-current -translate-y-1/2" />
  </div>
));
