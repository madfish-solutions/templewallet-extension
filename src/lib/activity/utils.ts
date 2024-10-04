import { ActivityOperKindEnum } from './types';

export function isTransferActivityOperKind(kind: ActivityOperKindEnum) {
  return (
    kind === ActivityOperKindEnum.transferTo_FromAccount ||
    kind === ActivityOperKindEnum.transferFrom_ToAccount ||
    kind === ActivityOperKindEnum.transferFrom ||
    kind === ActivityOperKindEnum.transferTo
  );
}
