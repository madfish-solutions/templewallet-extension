export enum E2eMessageType {
  ResetRequest = 'E2E/Reset/Request',
  ResetResponse = 'E2E/Reset/Response'
}

export interface E2eRequest {
  type: E2eMessageType.ResetRequest;
}

export interface E2eResponse {
  type: E2eMessageType.ResetResponse;
}
