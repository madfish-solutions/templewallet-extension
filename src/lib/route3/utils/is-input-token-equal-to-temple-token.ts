import { TEMPLE_TOKEN } from '../constants';
const TEMPLE_TOKEN_SLUG = `${TEMPLE_TOKEN.contract}_${TEMPLE_TOKEN.tokenId}`;

export const isInputTokenEqualToTempleToken = (inptuTokenSlug: string | undefined): boolean =>
  inptuTokenSlug === TEMPLE_TOKEN_SLUG;
