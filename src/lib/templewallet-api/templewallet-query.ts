import makeBuildQueryFn from 'lib/makeBuildQueryFn';

export const templewalletQuery = makeBuildQueryFn<Record<string, unknown>, any>('https://api.templewallet.com/api');
