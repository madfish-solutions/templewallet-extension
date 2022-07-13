import makeBuildQueryFn from 'lib/makeBuildQueryFn';

// export const templewalletQuery = makeBuildQueryFn<Record<string, unknown>, any>('https://api.templewallet.com/api');
export const templewalletQuery = makeBuildQueryFn<Record<string, unknown>, any>('http://localhost:8080/api');
