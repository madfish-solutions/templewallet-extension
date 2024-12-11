import { useState } from 'react';

import constate from 'constate';

import { ExchangeData } from 'lib/apis/exolix/types';

export const [ExchangeDataProvider, useExchangeDataState] = constate(() => {
  const [exchangeData, setExchangeData] = useState<ExchangeData | nullish>(null);

  return { exchangeData, setExchangeData };
});
