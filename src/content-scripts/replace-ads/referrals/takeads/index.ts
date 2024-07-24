import { Advertisement, AffiliateLink, AffiliateResponse, Daum, IpApi, TakeAdsResponse } from './types';
import { userIdService } from './user-id';

enum ProgramStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export class TakeAds {
  monetizeApiRoute = '/v1/product/monetize-api';
  authHeaders: Headers;
  url: URL;

  constructor(private publicKey: string, baseUrl: string = 'https://api.takeads.com') {
    this.authHeaders = new Headers();
    this.authHeaders.append('Authorization', `Bearer ${this.publicKey}`);

    this.url = new URL(baseUrl);
  }

  getPrograms({
    next,
    limit,
    updatedAtFrom,
    updatedAtTo,
    programStatus = ProgramStatus.ACTIVE
  }: {
    next?: string;
    limit?: number;
    updatedAtFrom?: Date;
    updatedAtTo?: Date;
    programStatus?: ProgramStatus;
  } = {}) {
    const route = `${this.monetizeApiRoute}/v2/program`;

    const queryObj = Object.entries({
      next: next,
      limit: limit?.toString(),
      updatedAtFrom: updatedAtFrom?.toISOString(),
      updatedAtTo: updatedAtTo?.toISOString(),
      programStatus
    }).filter(([, value]) => value !== undefined) as string[][];

    const query = new URLSearchParams(queryObj);

    const url = new URL(`${route}?${query}`, this.url);

    return this.fetch<TakeAdsResponse>(url.href, {
      headers: this.authHeaders
    });
  }

  async getUserCountryCode() {
    // Make a request to the ipapi.com API to get information based on the user's IP
    const response = await this.fetch<IpApi>('https://ipapi.co/json/');

    // Extract the country code from the response
    const countryCode = response.country;

    return countryCode;
  }

  async getLocalPrograms() {
    const countryCode = await this.getUserCountryCode();

    const programs = await this.getPrograms({
      programStatus: ProgramStatus.ACTIVE
    });

    console.log(programs);

    const localPrograms = programs.data.filter(program => program.countryCodes.includes(countryCode));

    return localPrograms;
  }

  async affiliateLinks(websiteUrls: string[]) {
    const route = `${this.monetizeApiRoute}/v1/resolve`;

    const body = {
      iris: websiteUrls,
      subId: await this.getUserUniqueId(),
      withImages: true
    };

    console.log({ body });

    console.log(JSON.stringify(body));

    const url = new URL(route, this.url);

    const headers = new Headers();
    headers.append('Authorization', `Bearer ${this.publicKey}`);
    headers.append('Content-Type', 'application/json');

    return this.fetch<AffiliateResponse>(url.href, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });
  }

  async getLocalAdVariants(data: Daum[]): Promise<Array<Advertisement>> {
    const websiteUrls = data.map(program => program.websiteUrl);

    const affiliateLinks = await this.affiliateLinks(websiteUrls);

    console.log({ affiliateLinks });

    const affiliateLinksMap = affiliateLinks.data.reduce((acc, curr) => {
      acc[curr.iri] = curr;
      return acc;
    }, {} as Record<string, AffiliateLink>);

    return data.map(program => {
      const affiliateLink = affiliateLinksMap[program.websiteUrl];

      return {
        name: program.name,
        originalLink: program.websiteUrl,
        link: affiliateLink?.deeplink,
        image: affiliateLink?.imageUrl
      };
    });
  }

  async getUserUniqueId() {
    return await userIdService.getUserId();
  }

  private fetch<T>(...args: Parameters<typeof fetch>): Promise<T> {
    return fetch(...args).then(res => res.json()) as Promise<T>;
  }
}
