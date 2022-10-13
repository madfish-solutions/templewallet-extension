import makeBuildQueryFn from 'lib/makeBuildQueryFn';

export const templewalletQuery = makeBuildQueryFn<Record<string, unknown>, any>('https://api.templewallet.com/api');
export const templewalletQueryLOCAL = makeBuildQueryFn<Record<string, unknown>, any>('http://localhost:3000/api');
