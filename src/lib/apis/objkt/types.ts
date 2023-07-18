interface Name {
  name: string;
}

export interface Tag {
  tag: Name;
}

export interface Attribute {
  attribute: Name;
}

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
  tags: Tag[];
  attributes: Attribute[];
}
