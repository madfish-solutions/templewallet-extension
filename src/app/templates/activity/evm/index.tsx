import React, { FC, memo } from 'react';

import clsx from 'clsx';

import { Anchor, HashShortView, IconBase, SyncSpinner } from 'app/atoms';
import { EmptyState } from 'app/atoms/EmptyState';
import { EvmNetworkLogo, NetworkLogoTooltipWrap, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { ReactComponent as CompactDownIcon } from 'app/icons/base/compact_down.svg';
import { ReactComponent as DocumentsIcon } from 'app/icons/base/documents.svg';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { getEvmTransactions, GoldRushTransaction } from 'lib/apis/temple/endpoints/evm';
import { t } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { useBooleanState } from 'lib/ui/hooks';
import { getEvmAddressSafe } from 'lib/utils/evm.utils';
import { useAccountAddressForEvm } from 'temple/front';
import { OneOfChains, useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { ReactComponent as InteractionsConnectorSvg } from '../interactions-connector.svg';

interface EvmActivityTabProps {
  chainId: number;
  assetSlug?: string;
}

export const EvmActivityTab: FC<EvmActivityTabProps> = ({ chainId, assetSlug }) => {
  const network = useEvmChainByChainId(chainId);
  const accountAddress = useAccountAddressForEvm();

  if (!network || !accountAddress) throw new DeadEndBoundaryError();

  const { data, isLoading: isSyncing } = useTypedSWR(['evm-activity-history', chainId], async () => {
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

function parseGoldRushTransaction(item: GoldRushTransaction, chainId: number, accountAddress: string): EvmActivity {
  const logEvents = item.log_events ?? [];

  return {
    chain: TempleChainKind.EVM,
    chainId,
    kind: (() => {
      if (!logEvents.length) {
        if (getEvmAddressSafe(item.from_address) === accountAddress) return ActivityKindEnum.send;
        if (getEvmAddressSafe(item.to_address) === accountAddress) return ActivityKindEnum.receive;
      } else if (logEvents.length === 1) {
        const logEvent = logEvents[0]!;
        if (logEvent.decoded?.name === 'Approval') return ActivityKindEnum.approve;

        if (logEvent.decoded?.name === 'Transfer') {
          if (getEvmAddressSafe(logEvent.decoded.params[0].value) === accountAddress) return ActivityKindEnum.send;
          if (getEvmAddressSafe(logEvent.decoded.params[1].value) === accountAddress) return ActivityKindEnum.receive;
        }
      }

      return ActivityKindEnum.interaction;
    })(),
    hash: item.tx_hash!,
    operations: logEvents.map<EvmOperation>(logEvent => ({
      kind: (() => {
        if (logEvent.decoded?.name === 'Approval') return ActivityKindEnum.approve;

        if (logEvent.decoded?.name === 'Transfer') {
          if (getEvmAddressSafe(logEvent.decoded.params[0].value) === accountAddress) return ActivityKindEnum.send;
          if (getEvmAddressSafe(logEvent.decoded.params[1].value) === accountAddress) return ActivityKindEnum.receive;
        }

        return ActivityKindEnum.interaction;
      })()
    }))
  };
}

const ActivityComponent: FC<{ activity: Activity; chain: OneOfChains }> = ({ activity, chain }) => {
  const [expanded, , , toggleExpanded] = useBooleanState(false);

  const networkName = chain.nameI18nKey ? t(chain.nameI18nKey) : chain.name;

  const hash = activity.hash;

  if (activity.kind !== ActivityKindEnum.interaction || activity.operations.length <= 1)
    return (
      <ActivityItemBaseComponent
        kind={activity.kind}
        hash={activity.hash}
        chainId={chain.chainId}
        networkName={networkName}
      />
    );

  const operations = activity.operations;

  return (
    <div className="flex flex-col">
      {operations.slice(0, 3).map((operation, i) => (
        <>
          {i > 0 && <InteractionsConnector />}

          <ActivityItemBaseComponent
            key={`${hash}-${i}`}
            kind={operation.kind}
            hash={hash}
            chainId={chain.chainId}
            networkName={networkName}
          />
        </>
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
                <>
                  {j > 0 && <InteractionsConnector />}

                  <ActivityItemBaseComponent
                    key={`${hash}-${j}`}
                    kind={operation.kind}
                    hash={hash}
                    chainId={chain.chainId}
                    networkName={networkName}
                  />
                </>
              ))
            : null}
        </>
      ) : null}
    </div>
  );
};

const InteractionsConnector = memo(() => (
  <div className="h-0 overflow-visible pl-7">
    <InteractionsConnectorSvg className="h-4 text-grey-3 fill-current stroke-current -translate-y-1/2" />
  </div>
));

interface ActivityItemBaseComponentProps {
  chainId: string | number;
  kind: ActivityKindEnum;
  hash: string;
  networkName: string;
}

const ActivityItemBaseComponent: FC<ActivityItemBaseComponentProps> = ({ kind, hash, chainId, networkName }) => {
  return (
    <Anchor className="group flex gap-x-2 p-2 rounded-lg hover:bg-secondary-low">
      <div className="relative flex items-center justify-center w-10">
        <div className="w-full h-full flex items-center justify-center rounded-full bg-grey-4">
          {/* <img alt="asset" className="w-9 h-9" /> */}
          <IconBase Icon={DocumentsIcon} size={16} className="text-grey-1" />
        </div>

        <NetworkLogoTooltipWrap networkName={networkName} className="absolute bottom-0 right-0">
          {typeof chainId === 'number' ? (
            <EvmNetworkLogo networkName={networkName} chainId={chainId} size={16} />
          ) : (
            <TezosNetworkLogo networkName={networkName} chainId={chainId} size={16} />
          )}
        </NetworkLogoTooltipWrap>
      </div>

      <div className="flex-grow flex flex-col gap-y-1">
        <div className="flex gap-x-2 justify-between">
          <div className="text-font-medium">{ActivityKindTitle[kind]}</div>

          <div className="text-font-num-14">-33 USDT</div>
        </div>

        <div className="flex gap-x-2 justify-between text-font-num-12 text-grey-1">
          <div className="flex items-center gap-x-1 group-hover:text-secondary">
            <HashShortView hash={hash} firstCharsCount={6} lastCharsCount={4} />

            <IconBase Icon={OutLinkIcon} size={12} className="invisible group-hover:visible" />
          </div>

          <div>-12.00 $</div>
        </div>
      </div>
    </Anchor>
  );
};

enum ActivityKindEnum {
  interaction,
  send,
  receive,
  swap,
  approve
}

const ActivityKindTitle: Record<ActivityKindEnum, string> = {
  [ActivityKindEnum.interaction]: 'Interaction',
  [ActivityKindEnum.send]: 'Send',
  [ActivityKindEnum.receive]: 'Receive',
  [ActivityKindEnum.swap]: 'Swap',
  [ActivityKindEnum.approve]: 'Approve'
};

type Activity = TezosActivity | EvmActivity;

interface ActivityBase {
  kind: ActivityKindEnum;
}

interface TezosActivity extends ActivityBase {
  chain: TempleChainKind.Tezos;
  chainId: string;
  hash: string;
  operations: TezosOperation[];
}

interface TezosOperation {
  kind: ActivityKindEnum;
}

interface EvmActivity extends ActivityBase {
  chain: TempleChainKind.EVM;
  chainId: number;
  hash: string;
  operations: EvmOperation[];
}

interface EvmOperation {
  kind: ActivityKindEnum;
}
