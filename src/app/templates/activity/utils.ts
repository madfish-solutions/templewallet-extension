import { ActivityOperKindEnum, Activity, EvmActivity, parseTezosPreActivityOperation } from 'lib/activity';
import { TezosPreActivity } from 'lib/activity/tezos/types';

export function isEvmActivity(activity: Activity | TezosPreActivity): activity is EvmActivity {
  return typeof activity.chainId === 'number';
}

export type FilterKind = 'send' | 'receive' | 'approve' | 'transfer' | 'bundle' | null;

export function getEvmActivityFaceKind({ operations, operationsCount }: EvmActivity) {
  return operationsCount === 1 ? operations.at(0)?.kind ?? ActivityOperKindEnum.interaction : 'batch';
}

const FILTER_KINDS: Record<ActivityOperKindEnum, FilterKind> = {
  [ActivityOperKindEnum.approve]: 'approve',
  [ActivityOperKindEnum.transferFrom]: 'transfer',
  [ActivityOperKindEnum.transferFrom_ToAccount]: 'send',
  [ActivityOperKindEnum.transferTo]: 'transfer',
  [ActivityOperKindEnum.transferTo_FromAccount]: 'receive',
  //
  [ActivityOperKindEnum.interaction]: null,
  [ActivityOperKindEnum.swap]: null
};

export function getEvmActivityFilterKind({ operations, operationsCount }: EvmActivity): FilterKind {
  if (operationsCount !== 1) return 'bundle';

  const kind = operations.at(0)?.kind ?? ActivityOperKindEnum.interaction;

  return FILTER_KINDS[kind];
}

export function getTezosPreActivityFilterKind({ operations }: TezosPreActivity, address: string): FilterKind {
  if (operations.length !== 1) return 'bundle';

  const operation = operations.at(0)!;

  const kind = parseTezosPreActivityOperation(operation, address)?.kind;

  return FILTER_KINDS[kind];
}
