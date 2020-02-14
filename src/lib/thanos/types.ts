export interface ThanosFrontState {
  unlocked: boolean;
  account: ThanosAccount | null;
}

export interface ThanosAccount {
  privateKey: string;
}

export enum ThanosMessageType {
  GET_STATE = "THANOS_WALLET_GET_STATE",
  STATE_UPDATED = "THANOS_WALLET_STATE_UPDATED",
  UNLOCK = "THANOS_WALLET_UNLOCK",
  IMPORT_ACCOUNT = "THANOS_WALLET_IMPORT_ACCOUNT"
}

export interface ThanosMessageBase {
  type: ThanosMessageType;
}

export interface ThanosUnlockRequest extends ThanosMessageBase {
  type: ThanosMessageType.UNLOCK;
  passphrase: string;
}
