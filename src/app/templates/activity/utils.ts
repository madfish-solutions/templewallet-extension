import {
  ActivityOperKindEnum,
  Activity,
  ActivityOperTransferType,
  TezosOperation,
  EvmOperation,
  TezosActivity,
  EvmActivity
} from 'lib/activity';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';

import type { AllEtherlinkActivitiesPageParams } from './fetch-activities-with-cache';

export type FaceKind = ActivityOperKindEnum | 'bundle';

export type FilterKind = 'send' | 'receive' | 'approve' | 'transfer' | 'bundle' | null;

export function getActivityOperTransferType(operation?: TezosOperation | EvmOperation) {
  if (operation?.kind !== ActivityOperKindEnum.transfer) return;

  return operation.type;
}

export function getActivityFilterKind(activity: Activity): FilterKind {
  const { operations, operationsCount } = activity;

  if (operationsCount !== 1) return 'bundle';

  const operation = operations.at(0);

  if (!operation) return null;

  switch (operation.kind) {
    case ActivityOperKindEnum.interaction:
      return null;
    case ActivityOperKindEnum.approve:
      return 'approve';
  }

  switch (operation.type) {
    case ActivityOperTransferType.send:
    case ActivityOperTransferType.receive:
      return 'transfer';
    case ActivityOperTransferType.sendToAccount:
      return 'send';
    case ActivityOperTransferType.receiveFromAccount:
      return 'receive';
  }

  return null;
}

export function isTezosActivity(activity: Activity): activity is TezosActivity {
  return 'oldestTzktOperation' in activity;
}

export function getAllEtherlinkActivitiesPageParams(
  activities: EvmActivity[]
): AllEtherlinkActivitiesPageParams | undefined {
  const lastActivity = activities.at(-1);

  if (!lastActivity) return;

  const tokensTransfers = activities.flatMap(({ operations, blockHeight }) =>
    operations
      .filter(op => op.kind === ActivityOperKindEnum.transfer && op.asset?.contract !== EVM_TOKEN_SLUG)
      .map(op => ({ ...op, blockHeight }))
      .reverse()
  );
  const lastTokenTransfer = tokensTransfers.at(-1);
  const explicitOperationsActivities = activities.filter(({ index }) => index !== null);
  const lastExplicitOperationActivity = explicitOperationsActivities.at(-1);

  return {
    operationsPageParams: lastExplicitOperationActivity
      ? {
          block_number: Number(lastExplicitOperationActivity.blockHeight),
          fee: lastExplicitOperationActivity.fee ?? '0',
          hash: lastExplicitOperationActivity.hash,
          index: lastExplicitOperationActivity.index ?? 0,
          inserted_at: lastExplicitOperationActivity.addedAt.replace(/(\.\d+)?Z$/, '.999999Z'),
          items_count: explicitOperationsActivities.length,
          value: lastExplicitOperationActivity.value ?? '0'
        }
      : undefined,
    tokensTransfersPageParams: lastTokenTransfer
      ? {
          block_number: Number(lastTokenTransfer.blockHeight),
          index: lastTokenTransfer.logIndex
        }
      : undefined
  };
}
