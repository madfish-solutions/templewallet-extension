import { ContractAbstraction, ContractProvider, ContractMethod } from '@taquito/taquito';

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
    price: number;
    currency_id: number;
    bigmap_key: number;
    marketplace_contract: string;
    __typename: 'offer_active';
  }[];
  __typename: 'token';
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
