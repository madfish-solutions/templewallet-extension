import { templeWalletApi } from './templewallet.api';

export interface KoloCryptoAddressResponse {
  address: string;
  memo?: string;
}

export const getKoloCryptoAddress = async (email: string, payway: string) => {
  const { data } = await templeWalletApi.get<KoloCryptoAddressResponse>('/kolo/crypto-address', {
    params: { email, payway }
  });

  return data;
};
