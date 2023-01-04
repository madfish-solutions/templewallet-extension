export enum E2eMessageType {
  ResetRequest = 'E2E/Reset/Request',
  ResetResponse = 'E2E/Reset/Response'
}

// ts-prune-ignore-next
export interface E2eRequest {
  type: E2eMessageType.ResetRequest;
}

// ts-prune-ignore-next
export interface E2eResponse {
  type: E2eMessageType.ResetResponse;
}
