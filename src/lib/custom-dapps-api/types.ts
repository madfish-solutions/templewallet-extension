export interface BcdDAppScreenshot {
  type: string;
  link: string;
}

export interface CustomDAppInfo {
  name: string;
  short_description: string;
  full_description: string;
  website: string;
  slug: string;
  authors: string[];
  social_links: string[] | null;
  interfaces: string[] | null;
  categories: string[];
  soon: boolean;
  logo: string;
  cover: string;
  screenshots?: BcdDAppScreenshot[];
  tvl: string;
}

export interface CustomDAppsInfo {
  dApps: CustomDAppInfo[];
  tvl: string;
}
