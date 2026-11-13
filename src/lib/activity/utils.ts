import { ActivityOperKindEnum, EvmOperation, TezosOperation } from './types';

export const isShieldedTezosOperation = (operation?: TezosOperation) =>
  operation?.kind !== ActivityOperKindEnum.approve && operation?.isShielded === true;

export const isBridgeOperation = (operation?: TezosOperation | EvmOperation) =>
  operation?.kind === ActivityOperKindEnum.transfer && operation.isBridge === true;
