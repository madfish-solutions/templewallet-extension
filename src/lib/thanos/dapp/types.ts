export type THanosDAppMessage = ThanosDAppRequest | ThanosDAppResponse;

export type ThanosDAppRequest =
  | ThanosDAppPermissionRequest
  | ThanosDAppOperationRequest;

export type ThanosDAppResponse =
  | ThanosDAppPermissionResponse
  | ThanosDAppOperationResponse;

export interface ThanosDAppMessageBase {
  type: ThanosDAppMessageType;
}

export enum ThanosDAppMessageType {
  PermissionRequest = "PERMISSION_REQUEST",
  PermissionResponse = "PERMISSION_RESPONSE",
  OperationRequest = "OPERATION_REQUEST",
  OperationResponse = "OPERATION_RESPONSE",
}

/**
 * Messages
 */

export interface ThanosDAppPermissionRequest extends ThanosDAppMessageBase {
  type: ThanosDAppMessageType.PermissionRequest;
  network: ThanosDAppNetwork;
  appMeta: ThanosDAppMetadata;
  force?: boolean;
}

export interface ThanosDAppPermissionResponse extends ThanosDAppMessageBase {
  type: ThanosDAppMessageType.PermissionResponse;
  pkh: string;
}

export interface ThanosDAppOperationRequest extends ThanosDAppMessageBase {
  type: ThanosDAppMessageType.OperationRequest;
  sourcePkh: string;
  opParams: any[];
}

export interface ThanosDAppOperationResponse extends ThanosDAppMessageBase {
  type: ThanosDAppMessageType.OperationResponse;
  opHash: string;
}

/**
 * Errors
 */
export enum ThanosDAppErrorType {
  NotGranted = "NOT_GRANTED",
  NotFound = "NOT_FOUND",
  InvalidParams = "INVALID_PARAMS",
}

/**
 * Misc
 */

export type ThanosDAppNetwork =
  | "mainnet"
  | "carthagenet"
  | {
      name: string;
      rpcUrl: string;
    };

export interface ThanosDAppMetadata {
  name: string;
}

export interface ThanosPageMessage {
  type: ThanosPageMessageType;
  payload: any;
  reqId?: string | number;
}

export enum ThanosPageMessageType {
  Request = "THANOS_PAGE_REQUEST",
  Response = "THANOS_PAGE_RESPONSE",
  ErrorResponse = "THANOS_PAGE_ERROR_RESPONSE",
}
