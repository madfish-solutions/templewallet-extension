const DISCONNECTED_PORT_ERROR_MESSAGE = 'Attempting to use a disconnected port object';
const EXTENSION_CONTEXT_INVALIDATED_ERROR_MESSAGE = 'Extension context invalidated';

const isDisconnectedPortError = (error: unknown): error is Error =>
  error instanceof Error && error.message.includes(DISCONNECTED_PORT_ERROR_MESSAGE);

const isExtensionContextInvalidatedError = (error: unknown): error is Error =>
  error instanceof Error && error.message.includes(EXTENSION_CONTEXT_INVALIDATED_ERROR_MESSAGE);

export const isIgnorableExtensionRuntimeError = (error: unknown): boolean =>
  isDisconnectedPortError(error) || isExtensionContextInvalidatedError(error);
