import { useSelector } from '../index';

export const useExolixCurrenciesLoadingSelector = () =>
  useSelector(({ cryptoExchange }) => cryptoExchange.exolixCurrencies.isLoading);

export const useAllExolixCurrenciesSelector = () =>
  useSelector(({ cryptoExchange }) => cryptoExchange.exolixCurrencies.data);

export const useExolixNetworksMapLoadingSelector = () =>
  useSelector(({ cryptoExchange }) => cryptoExchange.exolixNetworksMap.isLoading);

export const useExolixNetworksMapSelector = () =>
  useSelector(({ cryptoExchange }) => cryptoExchange.exolixNetworksMap.data);
