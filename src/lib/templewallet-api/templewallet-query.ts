import makeBuildQueryFn from 'lib/makeBuildQueryFn';

// const templeWalletApi = 'https://api.templewallet.com/api';
const templeWalletApi = 'http://localhost:3000/api';

export const templewalletQuery = makeBuildQueryFn<Record<string, unknown>, any>(templeWalletApi);
