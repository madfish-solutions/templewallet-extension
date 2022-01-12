import { OpKind } from '@taquito/taquito';
import { ParamsWithKind, TransferParams } from '@taquito/taquito/dist/types/operations/types';

export const parseTransferParamsToParamsWithKind = (transferParams: TransferParams): ParamsWithKind => ({
  ...transferParams,
  kind: OpKind.TRANSACTION
});
