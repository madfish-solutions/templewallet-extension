import { TokenInterface } from '../token.interface';

export const areTokensEqual = (aToken: TokenInterface, bToken: TokenInterface) => {
  if (aToken.id !== undefined && bToken.id !== undefined) {
    return aToken.address === bToken.address && aToken.id.isEqualTo(bToken.id);
  } else if (aToken.id === undefined && bToken.id === undefined) {
    return aToken.address === bToken.address;
  }

  return false;
};
