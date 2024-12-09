export const erc721TransferEvent = {
  anonymous: false,
  type: 'event',
  name: 'Transfer',
  inputs: [
    {
      indexed: true,
      name: 'from',
      type: 'address'
    },
    {
      indexed: true,
      name: 'to',
      type: 'address'
    },
    {
      indexed: true,
      name: 'tokenId',
      type: 'uint256'
    }
  ]
} as const;
