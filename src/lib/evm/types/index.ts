export enum EvmAssetStandard {
  NATIVE = 'native',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155'
}

export enum ContractInterfaceId {
  ERC721 = '0x80ac58cd',
  /** ERC-721 optional enumeration: `tokenOfOwnerByIndex` and `tokenByIndex`. */
  ERC721Enumerable = '0x780e9d63',
  ERC1155 = '0xd9b67a26'
}
