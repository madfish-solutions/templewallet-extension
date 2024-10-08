export const validateNonZero = (value: string, fieldName: string) =>
  value !== '0' || `${fieldName} should be more than 0`;
