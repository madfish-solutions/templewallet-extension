export class PublicError extends Error {
  readonly name = 'PublicError';
  constructor(message: string, public errors?: any[]) {
    super(message);
  }
}
