type AvailableToken = {
  contractAddress: string;
  decimals: number;
  name: string;
  tokenId?: number;
};

export type AvailableTokensResponse = {
  relayer: {
    address: string;
    pubkey: string;
  };
  tokens: AvailableToken[];
}

export type PriceQueryParams = {
  tokenAddress: string;
  tokenId?: number;
};

export type PriceQueryResponse = {
  price: number;
  decimals: number;
}

export type SubmitTransactionParams = {
  pubkey: string;
  signature: string;
  hash: string;
  contractAddress: string;
  to: string;
  tokenId?: number;
  amount: string;
  fee: number;
  callParams: {
    entrypoint: string;
    params: [{
      from_: any;
      txs: {
          to_: any;
          token_id: any;
          amount: any;
      }[];
    }[]] | [string, string, number];
  };
};
