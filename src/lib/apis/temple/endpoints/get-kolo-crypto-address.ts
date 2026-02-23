import { templeWalletApi } from './templewallet.api';

interface GetKoloCryptoAddressParams {
  payway: string;
  email: string;
}

interface GetKoloCryptoAddressResponse {
  address: string;
  memo?: string;
}

export const getKoloCryptoAddress = async ({ payway, email }: GetKoloCryptoAddressParams) => {
  const { data } = await templeWalletApi.get<GetKoloCryptoAddressResponse>('/kolo/crypto-address', {
    params: {
      payway,
      email
    }
  });

  return data;
};
