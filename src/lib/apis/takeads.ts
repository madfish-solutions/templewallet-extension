import axiosFetchAdapter from '@vespaiach/axios-fetch-adapter';
import axios, { AxiosInstance } from 'axios';

/**
 * API docs: https://docs.takeads.com
 */
export class TakeAds {
  private axios: AxiosInstance;

  constructor(private publicKey: string, private subId?: string, readonly apiUrl: string = 'https://api.takeads.com') {
    this.axios = axios.create({
      baseURL: apiUrl,
      headers: {
        Authorization: `Bearer ${this.publicKey}`
      },
      adapter: axiosFetchAdapter
    });
  }

  async affiliateLinks(websiteUrls: string[]) {
    const response = await this.axios.put<AffiliateResponse>('/v1/product/monetize-api/v2/resolve', {
      iris: websiteUrls,
      subId: this.subId,
      withImages: false
    });

    return response.data;
  }
}

export interface AffiliateResponse {
  data: AffiliateLink[];
}

interface AffiliateLink {
  iri: string;
  trackingLink: string;
  imageUrl: string | null;
}
