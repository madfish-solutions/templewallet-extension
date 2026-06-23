export const importResolveTcoModule = () => {
  // An error appears below if and only if the imported file is removed (ad-free build)
  // oxlint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore
  // oxlint-disable-next-line import/no-unresolved
  return import('lib/temple/back/web-widgets/resolve-tco');
};

export const importFetchObjktTokenModule = () => {
  // An error appears below if and only if the imported file is removed (ad-free build)
  // oxlint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore
  // oxlint-disable-next-line import/no-unresolved
  return import('lib/temple/back/web-widgets/fetch-objkt-token');
};

export const importFetchThumbnailModule = () => {
  // An error appears below if and only if the imported file is removed (ad-free build)
  // oxlint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore
  // oxlint-disable-next-line import/no-unresolved
  return import('lib/temple/back/web-widgets/fetch-thumbnail');
};

export const importCoinIndexModule = () => {
  // An error appears below if and only if the imported file is removed (ad-free build)
  // oxlint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore
  // oxlint-disable-next-line import/no-unresolved
  return import('lib/temple/back/web-widgets/fetch-coin-index');
};
