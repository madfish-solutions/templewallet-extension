import { templeWalletApi } from './templewallet.api';

export enum DappEnum {
  Exchanges = 'Exchanges',
  Marketplaces = 'Marketplaces',
  DeFi = 'DeFi',
  Collectibles = 'Collectibles',
  Games = 'Games',
  Other = 'Other'
}

export interface CustomDAppInfo {
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

export const getDAppsList = () => templeWalletApi.get<CustomDAppsInfo>('/dapps').then(res => res.data);
