export const isAbortError = (error: unknown) => error instanceof Error && error.name === 'AbortError';
