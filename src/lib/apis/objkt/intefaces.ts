export interface CollectibleInfoQueryResponse {
  token: CollectibleInfo[];
}

export interface CollectibleInfo {
  description: string;
  creators: {
    holder: {
      address: string;
      tzdomain: string;
    };
  }[];
  fa: {
    name: string;
    logo: string;
  };
}
