import { atomsToTokens } from 'lib/temple/helpers';

const YUPANA_TOKENS = [
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_0',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_2',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_3',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_4',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_5',
  'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec_6'
];
const YUPANA_MULTIPLIER = 18;

/** (!) Mutates & returns object */
export const fixBalances = (balances: StringRecord) => {
  for (const slug of YUPANA_TOKENS) {
    const balance = balances[slug];
    if (balance) balances[slug] = atomsToTokens(balance, YUPANA_MULTIPLIER).toFixed();
  }

  return balances;
};
