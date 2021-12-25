import BigNumber from 'bignumber.js';

export interface SwapInputValue {
  assetSlug?: string;
  amount?: BigNumber;
  usdAmount?: BigNumber;
}

export interface SwapFormValue {
  input: SwapInputValue;
  output: SwapInputValue;
  slippageTolerance?: number;
}
