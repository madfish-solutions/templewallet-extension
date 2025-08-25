import BigNumber from 'bignumber.js';

export interface SwapInputValue {
  assetSlug?: string;
  chainId?: number | string;
  amount?: BigNumber;
}

export interface SwapFormValue {
  input: SwapInputValue;
  output: SwapInputValue;
  isFiatMode: boolean;
}
