export const serializeError = (error: unknown) => {
  if (typeof error === 'string') {
    return error;
  }

  if (error == null) {
    return error;
  }

  if (Array.isArray(error)) {
    return JSON.stringify(error);
  }

  if (error instanceof Error) {
    return JSON.stringify({ ...error, name: error.name, message: error.message });
  }

  return JSON.stringify({ ...error });
};
