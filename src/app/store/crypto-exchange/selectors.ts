import { useSelector } from '../index';

export const useExolixCurrenciesLoadingSelector = () =>
  useSelector(({ cryptoExchange }) => cryptoExchange.exolixCurrencies.isLoading);

export const useAllExolixCurrenciesSelector = () =>
  useSelector(({ cryptoExchange }) => cryptoExchange.exolixCurrencies.data);
