export class AssertionError extends Error {
  constructor(message?: string, public actual?: any) {
    super(message);
  }
}

export default function assert(value: any, errorMessage = `The value ${value} is not truthy`): asserts value {
  if (!value) {
    throw new AssertionError(errorMessage, value);
  }
}
