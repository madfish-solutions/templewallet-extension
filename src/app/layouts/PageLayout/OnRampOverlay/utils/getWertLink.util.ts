import { templeWalletApi } from 'lib/apis/temple';

const BASE_URL = 'https://widget.wert.io/01H28HR1AXVTAD3AXW3DDFDY2Y/widget';

const DEFAULT_PARAMS = {
  network: 'tezos',
  commodity: 'XTZ',
  currency: 'USD',
  commodities: JSON.stringify([
    {
      commodity: 'XTZ',
      network: 'tezos'
    }
  ])
};

export const getWertLink = async (address: string, amount = 0) => {
  const { data: sessionId } = await templeWalletApi.get<string>('/wert-session-id');

  const url = new URL(BASE_URL);
  url.search = new URLSearchParams({
    ...DEFAULT_PARAMS,
    session_id: sessionId,
    currency_amount: amount.toString(),
    address
  }).toString();

  return url.toString();
};
