export class PublicError extends Error {
  readonly name = 'PublicError';
}

export function isPublicError(value: unknown): value is PublicError {
  // instanceof doesn't work in Jest
  return typeof value === 'object' && (value as any)?.name === 'PublicError';
}
