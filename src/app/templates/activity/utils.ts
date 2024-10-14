import { ActivityOperKindEnum, Activity, ActivityOperTransferType, TezosOperation, EvmOperation } from 'lib/activity';

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

  const kind = operation.kind;

  if (kind === ActivityOperKindEnum.interaction) return null;
  if (kind === ActivityOperKindEnum.approve) return 'approve';

  const type = operation.type;

  if (type === ActivityOperTransferType.fromUs || type === ActivityOperTransferType.toUs) return 'transfer';

  if (type === ActivityOperTransferType.fromUsToAccount) return 'send';

  if (type === ActivityOperTransferType.toUsFromAccount) return 'receive';

  return null;
}
