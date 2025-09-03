import { usePassiveStorage } from 'lib/temple/front/storage';

export type EquityCurrency = 'tez' | 'eth' | 'btc' | 'fiat';

export const useEquityCurrency = () => {
  const [equityCurrency, setEquityCurrency] = usePassiveStorage<EquityCurrency>('TOTAL_EQUITY_CURRENCY', 'fiat');

  return { equityCurrency, setEquityCurrency };
};
