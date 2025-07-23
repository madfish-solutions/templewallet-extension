import { templeWalletApi } from './templewallet.api';

enum DappEnum {
  Exchanges = 'Exchanges',
  Marketplaces = 'Marketplaces',
  Games = 'Games',
  DeFi = 'DeFi',
  Collectibles = 'Collectibles',
  Other = 'Other'
}

interface CustomDAppInfo {
  name: string;
  dappUrl: string;
  type: DappEnum;
  logo: string;
  slug: string;
  categories: DappEnum[];
}

interface CustomDAppsInfo {
  dApps: CustomDAppInfo[];
}

export const getDApps = () => templeWalletApi.get<CustomDAppsInfo>('/dapps').then(res => res.data);
