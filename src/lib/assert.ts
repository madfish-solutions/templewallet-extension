export class AssertionError extends Error {
  constructor(message?: string, public actual?: any) {
    super(message);
  }
}

export default function assert(value: any): asserts value {
  if (!value) {
    throw new AssertionError(`The value ${value} is not truthy`, value);
  }
}
