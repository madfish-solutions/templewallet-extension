import constate from 'constate';

import { ExchangeData } from 'lib/apis/exolix/types';
import { useStorage } from 'lib/temple/front';
import { useAccount } from 'temple/front';

export type Steps = 0 | 1 | 2 | 3;

export const [CryptoExchangeDataProvider, useCryptoExchangeDataState] = constate(() => {
  const currentAccount = useAccount();

  const [exchangeData, setExchangeData] = useStorage<ExchangeData | nullish>(
    `topup_exchange_data_state_${currentAccount.id}`,
    null
  );

  const [step, setStep] = useStorage<Steps>(`topup_step_state_${currentAccount.id}`, 0);

  return { exchangeData, setExchangeData, step, setStep };
});
