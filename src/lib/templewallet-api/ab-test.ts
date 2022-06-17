import makeBuildQueryFn from 'lib/makeBuildQueryFn';

const buildQuery = makeBuildQueryFn<Record<string, unknown>, any>('https://api.templewallet.com/api');

export const getABGroup = buildQuery<{}, { ab: 'A' | 'B' }>('GET', '/abtest');
