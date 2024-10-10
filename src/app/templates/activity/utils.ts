import { ActivityOperKindEnum, Activity } from 'lib/activity';

export type FaceKind = ActivityOperKindEnum | 'bundle';

export type FilterKind = 'send' | 'receive' | 'approve' | 'transfer' | 'bundle' | null;

const KINDS_MAP: Record<FaceKind, FilterKind> = {
  bundle: 'bundle',
  [ActivityOperKindEnum.approve]: 'approve',
  [ActivityOperKindEnum.transferFrom]: 'transfer',
  [ActivityOperKindEnum.transferFrom_ToAccount]: 'send',
  [ActivityOperKindEnum.transferTo]: 'transfer',
  [ActivityOperKindEnum.transferTo_FromAccount]: 'receive',
  //
  [ActivityOperKindEnum.interaction]: null,
  [ActivityOperKindEnum.swap]: null
};

export function getActivityFilterKind(activity: Activity): FilterKind {
  const faceKind = getActivityFaceKind(activity);

  return KINDS_MAP[faceKind];
}

function getActivityFaceKind({ operations, operationsCount }: Activity): FaceKind {
  return operationsCount === 1 ? operations.at(0)?.kind ?? ActivityOperKindEnum.interaction : 'bundle';
}
