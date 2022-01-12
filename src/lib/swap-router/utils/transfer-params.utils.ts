import { OpKind, WalletParamsWithKind } from '@taquito/taquito';
import { TransferParams } from '@taquito/taquito/dist/types/operations/types';

export const parseTransferParamsToParamsWithKind = (transferParams: TransferParams): WalletParamsWithKind => ({
  ...transferParams,
  kind: OpKind.TRANSACTION
});
