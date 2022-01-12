import { OpKind, TransferParams, WalletParamsWithKind } from '@taquito/taquito';

export const parseTransferParamsToParamsWithKind = (transferParams: TransferParams): WalletParamsWithKind => ({
  ...transferParams,
  kind: OpKind.TRANSACTION
});
