import { tokenToSlug } from 'lib/assets';
import { DEPRECATED_TKEY_METADATA } from 'lib/assets/known-tokens';
import type { TokenMetadata } from 'lib/metadata';

export const mockFA1_2TokenMetadata: TokenMetadata = {
  id: '0',
  address: 'fa12TokenAddress',
  name: 'Mock FA1.2 token',
  symbol: 'MOCK12',
  decimals: 6,
  thumbnailUri: 'https://fakeurl.com/img.png'
};

export const mockFA2TokenMetadata: TokenMetadata = {
  id: '2',
  address: 'fa2TokenAddress',
  name: 'Mock FA2 token',
  symbol: 'MOCK2',
  decimals: 8,
  thumbnailUri: 'https://fakeurl.com/img2.png'
};

export const patchMetadatas = (tokensMetadata: TokenMetadata[]): TokenMetadata[] => {
  const slug = tokenToSlug(DEPRECATED_TKEY_METADATA);

  return tokensMetadata.map(metadata => (tokenToSlug(metadata) === slug ? DEPRECATED_TKEY_METADATA : metadata));
};
