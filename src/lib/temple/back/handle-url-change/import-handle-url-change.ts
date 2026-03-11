export const importHandleUrlChangeModule = async () => {
  // An error appears below if and only the imported file is removed
  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore
  // eslint-disable-next-line import/no-unresolved
  return await import('lib/temple/back/handle-url-change/handle-url-change');
};
