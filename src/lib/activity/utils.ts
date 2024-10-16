import { ActivityOperKindEnum } from './types';

export function isTransferActivityOperKind(kind: ActivityOperKindEnum) {
  return kind === ActivityOperKindEnum.transfer;
}
