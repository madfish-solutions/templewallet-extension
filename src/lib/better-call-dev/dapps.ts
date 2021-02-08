import { buildQuery } from "./base";

/**
 * Queries
 */

export const getDApps = buildQuery<{}, BcdDAppInfo[]>("GET", "/dapps");

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

export interface BcdDAppScreenshot {
  type: string;
  link: string;
}
