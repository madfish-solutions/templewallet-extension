import * as bs58check from "bs58check";
import { Buffer } from "buffer";

export interface AppMetadata {
  beaconId: string;
  name: string;
  icon?: string;
}

export type NetworkType = "mainnet" | "carthagenet" | "custom";

export interface Network {
  type: NetworkType;
  name?: string;
  rpcUrl?: string;
}

export type Request = PermissionRequest | OperationRequest;

export type Response = ErrorResponse | PermissionResponse | OperationResponse;

export enum MessageType {
  Error = "error",
  PermissionRequest = "permission_request",
  SignPayloadRequest = "sign_payload_request",
  OperationRequest = "operation_request",
  BroadcastRequest = "broadcast_request",
  PermissionResponse = "permission_response",
  SignPayloadResponse = "sign_payload_response",
  OperationResponse = "operation_response",
  BroadcastResponse = "broadcast_response",
}

export interface BaseMessage {
  type: MessageType;
  version: string;
  id: string; // ID of the message. The same ID is used in the request and response
  beaconId: string; // ID of the sender. This is used to identify the sender of the message
}

export enum PermissionScope {
  SIGN = "sign",
  OPERATION_REQUEST = "operation_request",
  THRESHOLD = "threshold",
}

export interface PermissionRequest extends BaseMessage {
  type: MessageType.PermissionRequest;
  appMetadata: AppMetadata;
  network: Network;
  scopes: PermissionScope[];
}

export interface PermissionResponse extends BaseMessage {
  type: MessageType.PermissionResponse;
  network: Network; // Network on which the permissions have been granted
  publicKey: string; // Public Key, because it can be used to verify signatures
  scopes: PermissionScope[]; // Permissions that have been granted for this specific address / account
  threshold?: {
    amount: string;
    timeframe: string;
  };
}

export interface SignPayloadRequest extends BaseMessage {
  type: MessageType.SignPayloadRequest;
  sourceAddress: string;
  payload: string;
}

export interface SignPayloadResponse extends BaseMessage {
  type: MessageType.SignPayloadResponse;
  signature: string;
}

export interface OperationRequest extends BaseMessage {
  type: MessageType.OperationRequest;
  network: Network;
  operationDetails: any[];
  sourceAddress: string;
}

export interface OperationResponse extends BaseMessage {
  type: MessageType.OperationResponse;
  transactionHash: string;
}

export enum ErrorType {
  BROADCAST_ERROR = "BROADCAST_ERROR", // Broadcast | Operation Request: Will be returned if the user chooses that the transaction is broadcast but there is an error (eg. node not available).
  NETWORK_NOT_SUPPORTED = "NETWORK_NOT_SUPPORTED", // Permission: Will be returned if the selected network is not supported by the wallet / extension.
  NO_ADDRESS_ERROR = "NO_ADDRESS_ERROR", // Permission: Will be returned if there is no address present for the protocol / network requested.
  NO_PRIVATE_KEY_FOUND_ERROR = "NO_PRIVATE_KEY_FOUND_ERROR", // Sign: Will be returned if the private key matching the sourceAddress could not be found.
  NOT_GRANTED_ERROR = "NOT_GRANTED_ERROR", // Sign: Will be returned if the signature was blocked // (Not needed?) Permission: Will be returned if the permissions requested by the App were not granted.
  PARAMETERS_INVALID_ERROR = "PARAMETERS_INVALID_ERROR", // Operation Request: Will be returned if any of the parameters are invalid.
  TOO_MANY_OPERATIONS = "TOO_MANY_OPERATIONS", // Operation Request: Will be returned if too many operations were in the request and they were not able to fit into a single operation group.
  TRANSACTION_INVALID_ERROR = "TRANSACTION_INVALID_ERROR", // Broadcast: Will be returned if the transaction is not parsable or is rejected by the node.
  UNKNOWN_ERROR = "UNKNOWN_ERROR", // Used as a wildcard if an unexpected error occured.
}

export interface ErrorResponse extends BaseMessage {
  type: MessageType.Error;
  errorType: ErrorType;
}

export function encodeMessage<T = unknown>(msg: T): string {
  return bs58check.encode(Buffer.from(JSON.stringify(msg)));
}

export function decodeMessage<T = unknown>(encoded: string): T {
  return JSON.parse(bs58check.decode(encoded).toString());
}

export function formatOpParams(op: any) {
  const { fee, gas_limit, storage_limit, ...rest } = op;
  if (op.kind === "transaction") {
    const { to, destination, amount, parameter, parameters, ...txRest } = rest;
    return {
      ...txRest,
      to: to ?? destination,
      amount: +amount,
      mutez: true,
      parameter: parameter ?? parameters,
    };
  }
  return rest;
}
