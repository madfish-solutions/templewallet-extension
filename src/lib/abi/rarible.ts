export const raribleCreateTokenAbi = {
  inputs: [
    { internalType: 'string', name: '_name', type: 'string' },
    { internalType: 'string', name: '_symbol', type: 'string' },
    { internalType: 'string', name: 'baseURI', type: 'string' },
    { internalType: 'string', name: 'contractURI', type: 'string' },
    { internalType: 'address[]', name: 'operators', type: 'address[]' },
    { internalType: 'uint256', name: 'salt', type: 'uint256' }
  ],
  name: 'createToken',
  outputs: [],
  stateMutability: 'nonpayable',
  type: 'function'
} as const;

export const erc721RaribleMintAndTransferAbi = {
  inputs: [
    {
      components: [
        { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
        { internalType: 'string', name: 'tokenURI', type: 'string' },
        {
          components: [
            { internalType: 'address payable', name: 'account', type: 'address' },
            { internalType: 'uint96', name: 'value', type: 'uint96' }
          ],
          internalType: 'struct LibPart.Part[]',
          name: 'creators',
          type: 'tuple[]'
        },
        {
          components: [
            { internalType: 'address payable', name: 'account', type: 'address' },
            { internalType: 'uint96', name: 'value', type: 'uint96' }
          ],
          internalType: 'struct LibPart.Part[]',
          name: 'royalties',
          type: 'tuple[]'
        },
        { internalType: 'bytes[]', name: 'signatures', type: 'bytes[]' }
      ],
      internalType: 'struct LibERC721LazyMint.Mint721Data',
      name: 'data',
      type: 'tuple'
    },
    { internalType: 'address', name: 'to', type: 'address' }
  ],
  name: 'mintAndTransfer',
  outputs: [],
  stateMutability: 'nonpayable',
  type: 'function'
} as const;

export const erc1155RaribleMintAndTransferAbi = {
  inputs: [
    {
      components: [
        { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
        { internalType: 'string', name: 'tokenURI', type: 'string' },
        { internalType: 'uint256', name: 'supply', type: 'uint256' },
        {
          components: [
            { internalType: 'address payable', name: 'account', type: 'address' },
            { internalType: 'uint96', name: 'value', type: 'uint96' }
          ],
          internalType: 'struct LibPart.Part[]',
          name: 'creators',
          type: 'tuple[]'
        },
        {
          components: [
            { internalType: 'address payable', name: 'account', type: 'address' },
            { internalType: 'uint96', name: 'value', type: 'uint96' }
          ],
          internalType: 'struct LibPart.Part[]',
          name: 'royalties',
          type: 'tuple[]'
        },
        { internalType: 'bytes[]', name: 'signatures', type: 'bytes[]' }
      ],
      internalType: 'struct LibERC1155LazyMint.Mint1155Data',
      name: 'data',
      type: 'tuple'
    },
    { internalType: 'address', name: 'to', type: 'address' },
    { internalType: 'uint256', name: '_amount', type: 'uint256' }
  ],
  name: 'mintAndTransfer',
  outputs: [],
  stateMutability: 'nonpayable',
  type: 'function'
} as const;
