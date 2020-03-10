export enum MessageType {
  Res = "INTERCOM_RESPONSE", // request responses
  Err = "INTERCOM_ERROR", // request error
  Sub = "INTERCOM_SUBSCRIPTION" // subscription updates
}

export interface RequestMessage {
  payload: any;
  reqId: number;
}

export type ServerMessage =
  | SubscriptionMessage
  | ResponseSuccessMessage
  | ResponseSuccessMessage;

export interface SubscriptionMessage {
  type: MessageType.Sub;
  data: any;
}

export interface ResponseSuccessMessage {
  type: MessageType.Res;
  data: any;
  reqId: number;
}

export interface ResponseErrorMessage {
  type: MessageType.Err;
  data: any;
  reqId: number;
}
