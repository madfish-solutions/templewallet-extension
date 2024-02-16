import { ContractAbstraction, ContractProvider, ContractMethod } from '@taquito/taquito';
interface Name {
  name: string;
}

export interface ObjktTag {
  tag: Name;
}

export interface ObjktAttribute {
  attribute: {
    id: number;
    name: string;
    value: string;
    attribute_counts: {
      fa_contract: string;
      editions: number;
    }[];
  };
}

interface ObjktListing {
  currency_id: number;
  price: number;
}

export interface ObjktOffer {
  buyer_address: string;
  price: number;
  currency_id: number;
  bigmap_key: number;
  marketplace_contract: string;
  __typename: 'offer_active';
}

export interface UserObjktCollectible {
  /** Contract address */
  fa_contract: string;
  token_id: string;
  listings_active: [ObjktListing];
  description: string | null;
  /** Minted on date.
   * ISO String (e.g. `2023-05-30T09:40:33+00:00`)
   */
  timestamp: string;
  metadata: string | null;
  mime: string | null;
  artifact_uri: string;
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
      /** Primary Key */
      pk: number;
      editions: number;
    };
  }[];
  tags: ObjktTag[];
  attributes: ObjktAttribute[];
  supply: number;
  royalties: {
    decimals: number;
    amount: number;
  }[];
  __typename: 'token';
}

export interface ObjktCollectibleExtra {
  offers_active: ObjktOffer[];
}

export interface ObjktGalleryAttributeCount {
  attribute_id: number;
  gallery_pk: number;
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
