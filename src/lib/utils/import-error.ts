const isImportError = (error: unknown): error is Error =>
  error instanceof Error &&
  'code' in error &&
  (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND');

export async function withNonImportErrorForwarding<T>(factory: () => Promise<T>) {
  try {
    return await factory();
  } catch (error) {
    if (isImportError(error)) {
      return;
    }

    throw error;
  }
}
