export interface GetUserObjktCollectiblesResponse {
  token: UserObjktCollectible[];
}

interface ObjktListing {
  currency_id: number;
  price: number;
}

export interface UserObjktCollectible {
  fa_contract: string;
  token_id: string;
  listings_active: ObjktListing[];
  description: string | null;
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
  galleries: {
    gallery: {
      name: string;
    };
  }[];
  offers_active: {
    buyer_address: string;
    collection_offer: string | null;
    price: number;
    price_xtz: number;
    bigmap_key: number;
    marketplace_contract: string;
    fa_contract: string;
    currency_id: number;
  }[];
}
