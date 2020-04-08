export enum MessageType {
  Req = "INTERCOM_REQUEST", // Request responses
  Res = "INTERCOM_RESPONSE", // Reponse message
  Err = "INTERCOM_ERROR", // Error message
  Sub = "INTERCOM_SUBSCRIPTION", // Subscription updates
}

export interface Message {
  type: MessageType;
  data: any;
}

export interface ReqResMessage extends Message {
  type: MessageType.Req | MessageType.Res | MessageType.Err;
  reqId: number;
}

export interface RequestMessage extends ReqResMessage {
  type: MessageType.Req;
}

export interface ResponseMessage extends ReqResMessage {
  type: MessageType.Res;
}

export interface ErrorMessage extends ReqResMessage {
  type: MessageType.Err;
}

export interface SubscriptionMessage extends Message {
  type: MessageType.Sub;
}
