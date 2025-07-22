export const areStringArraysEqual = (a: string[], b: string[]) => {
  const len = a.length;

  if (len !== b.length) return false;

  for (let i = len - 1; i >= 0; i--) {
    if (a[i] !== b[i]) return false;
  }

  return true;
};
