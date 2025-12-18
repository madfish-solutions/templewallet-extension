export const importUpdateRulesStorageModule = () => {
  // An error appears below if and only the imported file is removed
  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore
  // eslint-disable-next-line import/no-unresolved
  return import('./update-rules-storage');
};
