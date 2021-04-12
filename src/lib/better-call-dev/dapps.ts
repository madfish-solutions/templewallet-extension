import { BcdNetwork, buildQuery } from "./base";
import { BcdToken } from "./tokens";

/**
 * Queries
 */

export const getDApps = buildQuery<{}, BcdDAppInfo[]>("GET", "/dapps");

export const getDAppDetails = buildQuery<{ slug: string }, BcdDetailedDAppInfo>(
  "GET",
  ({ slug }) => `/dapps/${slug}`
);

export interface BcdDAppInfo {
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
}

export interface BcdDAppContract {
  network: BcdNetwork;
  alias?: string;
  address: string;
  release_date: string;
}

export interface BcdDetailedDAppInfo extends BcdDAppInfo {
  contracts: BcdDAppContract[];
  dex_tokens?: BcdToken[];
  volume_24_hours?: number;
}

export interface BcdDAppScreenshot {
  type: string;
  link: string;
}
