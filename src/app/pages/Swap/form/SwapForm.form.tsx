import BigNumber from 'bignumber.js';

export interface SwapInputValue {
  assetSlug?: string;
  amount?: BigNumber;
}

export interface SwapFormValue {
  input: SwapInputValue;
  output: SwapInputValue;
  isFiatMode: boolean;
}
