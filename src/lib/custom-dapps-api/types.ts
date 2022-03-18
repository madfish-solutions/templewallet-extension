export interface CustomDAppInfo {
  id: number;
  name: string;
  dappUrl: string;
  type: string;
  logo: string;
  slug: string;
  categories: string[];
}

export interface CustomDAppsInfo {
  dApps: CustomDAppInfo[];
}
