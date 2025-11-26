import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { toTokenSlug } from 'lib/assets/utils';
import { EVM_ZERO_ADDRESS } from 'lib/constants';

export function getTokenSlugFromEvmDexTokenAddress(address: string) {
  return EVM_ZERO_ADDRESS === address ? EVM_TOKEN_SLUG : toTokenSlug(address, 0);
}
