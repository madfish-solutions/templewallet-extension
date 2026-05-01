import { isTerminalPhase } from 'lib/cross-chain';

import { useSelector } from '../index';

import { CrossChainExchange } from './state';

export const useCrossChainExchangeSelector = (id: string | undefined): CrossChainExchange | undefined =>
  useSelector(({ crossChainSend }) => (id ? crossChainSend.byId[id] : undefined));

const useCrossChainByIdSelector = () => useSelector(({ crossChainSend }) => crossChainSend.byId);
const useCrossChainIdsSelector = () => useSelector(({ crossChainSend }) => crossChainSend.ids);

export const useAllCrossChainExchangesSelector = () => {
  const byId = useCrossChainByIdSelector();
  const ids = useCrossChainIdsSelector();
  return ids.map(id => byId[id]).filter(Boolean);
};

export const useCrossChainExchangesForAccountSelector = (accountId: string | undefined) => {
  const all = useAllCrossChainExchangesSelector();
  return accountId ? all.filter(e => e.accountId === accountId) : [];
};

export const useHasActiveCrossChainExchangesSelector = (accountId: string | undefined) => {
  const forAccount = useCrossChainExchangesForAccountSelector(accountId);
  return forAccount.some(e => !isTerminalPhase(e.phase) || (e.phase === 'FAILED' && !e.bannerDismissed));
};
