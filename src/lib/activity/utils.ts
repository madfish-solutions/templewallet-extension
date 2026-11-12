import { ActivityOperKindEnum, EvmOperation, TezosOperation } from './types';

export function isTransferActivityOperKind(kind: ActivityOperKindEnum) {
  return kind === ActivityOperKindEnum.transfer;
}

export const getTezosOperationIsShielded = (operation?: TezosOperation) =>
  operation?.kind !== ActivityOperKindEnum.approve && operation?.isShielded === true;

export const getOperationIsBridge = (operation?: TezosOperation | EvmOperation) =>
  operation?.kind === ActivityOperKindEnum.transfer && operation.isBridge === true;
