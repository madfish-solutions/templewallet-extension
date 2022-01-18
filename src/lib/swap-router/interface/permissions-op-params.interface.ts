import { TransferParams } from '@taquito/taquito/dist/types/operations/types';

export interface PermissionsOpParams {
  approve: TransferParams[];
  revoke: TransferParams[];
}
