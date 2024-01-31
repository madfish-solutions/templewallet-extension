import { isDefined } from '@rnw-community/shared';

export const getLocalStorageUsageDetails = () => {
  const recordsNumber = localStorage.length;
  const keys = new Array(recordsNumber).fill(null).map((_, i) => localStorage.key(i));

  const keysTotalChars = keys.reduce((acc, key) => acc + (key?.length ?? 0), 0);

  const valuesTotalChars = keys.reduce((acc, key) => {
    const value = isDefined(key) ? localStorage.getItem(key) : null;
    return acc + (value?.length ?? 0);
  }, 0);

  return {
    recordsNumber,
    keysTotalChars,
    valuesTotalChars
  };
};
