export const getLocalStorageUsageDetails = () => {
  const recordsNumber = localStorage.length;
  const keys = new Array(recordsNumber).fill(null).map((_, i) => localStorage.key(i));

  const keysTotalChars = keys.reduce((acc, key) => acc + (key?.length ?? 0), 0);

  const valuesTotalChars = keys.reduce((acc, key) => {
    const value = key == null ? null : localStorage.getItem(key);
    return acc + (value?.length ?? 0);
  }, 0);

  return {
    recordsNumber,
    keysTotalChars,
    valuesTotalChars
  };
};
