import BigNumber from 'bignumber.js';

export const TEZ_TOKEN_SLUG = 'tez';
export const GAS_TOKEN_SLUG = TEZ_TOKEN_SLUG;

export const toTokenSlug = (contract: string, id: BigNumber.Value = 0) => {
  return `${contract}_${new BigNumber(id).toFixed()}`;
};

export const tokenToSlug = <T extends { address: string; id?: BigNumber.Value }>({ address, id }: T) => {
  return toTokenSlug(address, id);
};
