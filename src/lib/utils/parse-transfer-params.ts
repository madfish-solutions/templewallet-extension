import { OpKind, TransferParams, WalletParamsWithKind } from '@tezos-x/octez.js';

export const parseTransferParamsToParamsWithKind = (transferParams: TransferParams): WalletParamsWithKind => ({
  ...transferParams,
  kind: OpKind.TRANSACTION
});
