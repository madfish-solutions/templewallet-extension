type QuipuswapTokenBase = {
  network: string;
  type: "fa1.2" | "fa2";
  contractAddress: string;
  metadata?: {
    decimals: number;
    symbol: string;
    name: string;
    thumbnailUri: string;
  };
};

export type QuipuswapFA12Token = QuipuswapTokenBase & {
  type: "fa1.2";
};

export type QuipuswapFA2Token = QuipuswapTokenBase & {
  type: "fa2";
  fa2TokenId: number;
};

export type QuipuswapToken = QuipuswapFA12Token | QuipuswapFA2Token;
