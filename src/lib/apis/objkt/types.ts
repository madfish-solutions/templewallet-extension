import { ContractAbstraction, ContractProvider, ContractMethod } from '@taquito/taquito';

export interface GetUserObjktCollectiblesResponse {
  token: UserObjktCollectible[];
  gallery_attribute_count: ObjktGalleryAttributeCount[];
}

interface ObjktListing {
  currency_id: number;
  price: number;
}

export interface UserObjktCollectible {
  /** Contract address */
  fa_contract: string;
  token_id: string;
  listings_active: ObjktListing[];
  description: string | null;
  /** Minted on date.
   * ISO String (e.g. `2023-05-30T09:40:33+00:00`)
   */
  timestamp: string;
  metadata: string | null;
  creators: {
    holder: {
      address: string;
      tzdomain: string;
    };
  }[];
  fa: {
    name: string;
    logo: string;
    editions: number;
  };
  galleries: {
    gallery: {
      name: string;
      editions: number;
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
    __typename: 'offer_active';
  }[];
  attributes: {
    attribute: {
      id: number;
      name: string;
      value: string;
      attribute_counts: {
        editions: number;
      }[];
    };
  }[];
  supply: number;
  royalties: {
    decimals: number;
    amount: number;
  }[];
  __typename: 'token';
}

export interface ObjktGalleryAttributeCount {
  attribute_id: number;
  editions: number;
}

export interface ObjktContractInterface extends ContractAbstraction<ContractProvider> {
  methods: {
    fulfill_offer: (offer_id: number, token_id: number) => ContractMethod<ContractProvider>;
  };
}

export interface FxHashContractInterface extends ContractAbstraction<ContractProvider> {
  methods: {
    offer_accept: (offer_id: number) => ContractMethod<ContractProvider>;
  };
}
