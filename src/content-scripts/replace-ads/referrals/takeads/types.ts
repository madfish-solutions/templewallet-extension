export interface IpApi {
  ip: string;
  network: string;
  version: string;
  city: string;
  region: string;
  region_code: string;
  country: string;
  country_name: string;
  country_code: string;
  country_code_iso3: string;
  country_capital: string;
  country_tld: string;
  continent_code: string;
  in_eu: boolean;
  postal: string;
  latitude: number;
  longitude: number;
  timezone: string;
  utc_offset: string;
  country_calling_code: string;
  currency: string;
  currency_name: string;
  languages: string;
  country_area: number;
  country_population: number;
  asn: string;
  org: string;
}
export interface TakeAdsResponse {
  meta: Meta;
  data: Daum[];
}

export interface Meta {
  limit: number;
  next: string;
}

export interface Daum {
  id: string;
  name: string;
  websiteUrl: string;
  imageUrl: string;
  countryCodes: string[];
  languageCodes: never[];
  avgCommission?: number;
  updatedAt: string;
  hostname: string;
  programStatus: string;
  merchantId: number;
  pricingModel: string;
}

export interface AffiliateResponse {
  data: AffiliateLink[];
}

export interface AffiliateLink {
  iri: string;
  trackingLink: string;
  imageUrl: string;
}

export interface Advertisement {
  name: string;
  originalLink: string;
  link: string;
  image: string;
}
