let pendingConfirmationId: string | nullish;

export function getPendingConfirmationId() {
  return pendingConfirmationId;
}

export function setPendingConfirmationId(value: string) {
  pendingConfirmationId = value;
}

export function resetPendingConfirmationId() {
  pendingConfirmationId = null;
}
