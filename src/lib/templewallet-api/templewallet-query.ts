import makeBuildQueryFn from 'lib/makeBuildQueryFn';

const templeWalletApi = 'https://api.templewallet.com/api';

export const templewalletQuery = makeBuildQueryFn<Record<string, unknown>, any>(templeWalletApi);
