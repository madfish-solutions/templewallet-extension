import axios from 'axios';

export enum DappEnum {
  Exchanges = 'Exchanges',
  Marketplaces = 'Marketplaces',
  Games = 'Games',
  DeFi = 'DeFi',
  Collectibles = 'Collectibles',
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

export function getDApps() {
  return axios.get<CustomDAppsInfo>('https://api.templewallet.com/api/dapps').then(res => res.data);
}
