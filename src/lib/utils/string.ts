export const calculateStringSizeInBytes = (value: string) => {
  // Encode the string into UTF-8
  const encoder = new TextEncoder();
  const encodedString = encoder.encode(value);

  // Count the number of bytes
  return encodedString.length;
};
