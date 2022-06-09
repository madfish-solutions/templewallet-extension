import { IOperation } from 'lib/temple/repo';

const OPERATION_TOKEN_TRANSFER_ONLY = {
  hash: 'ooB5B636cUpMqJV17Z3DSmgSqw9RvRKvt9vHsUwi3ghLBe3CzmC',
  chainId: 'NetXxkAx4woPLyu',
  members: ['tz1KoLibimdjUSfhrSpXwx4FhhhCq1JM5Etk', 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'],
  assetIds: ['KT1NbznEfpxZZyPUNcSWRm9Y8qZkdEgWEFaV_0'],
  addedAt: 1624346191000,
  data: {
    tzktGroup: [
      {
        type: 'transaction',
        id: 2866005,
        level: 227013081,
        timestamp: '2021-06-14T12:08:04Z',
        block: 'BMNEHzDdZLccdRFn7c7uwWoHR5mkSDH7eU8R4LsZJysu27Dn8nw',
        hash: 'opZG7XNt1wHxvLeUZxQ5WkKJZCm64kMjbUPeGS8BTiehB5pBYsX',
        counter: 23375,
        initiator: {
          address: 'tz1KoLibimdjUSfhrSpXwx4FhhhCq1JM5Etk'
        },
        sender: {
          address: 'tz1KoLibimdjUSfhrSpXwx4FhhhCq1JM5Etk'
        },
        nonce: 0,
        gasLimit: 0,
        gasUsed: 1427,
        storageLimit: 0,
        storageUsed: 0,
        bakerFee: 0,
        storageFee: 0,
        allocationFee: 0,
        target: {
          address: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'
        },
        amount: 0,
        status: 'applied',
        hasInternals: false
      }
    ],
    tzktTokenTransfers: [
      {
        amount: '162162162162162160000',
        from: { alias: 'QuipuSwap wUSDC', address: 'tz1KoLibimdjUSfhrSpXwx4FhhhCq1JM5Etk' },
        to: { address: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o' },
        id: 227013117,
        level: 2347253,
        timestamp: '2022-05-08T11:30:44Z',
        token: {
          contract: { alias: 'Wrapped Tokens Contract', address: 'KT1NbznEfpxZZyPUNcSWRm9Y8qZkdEgWEFaV' },
          id: 103879,
          metadata: { name: 'Wrapped USDC', symbol: 'wUSDC', decimals: '6' },
          standard: 'fa2',
          tokenId: '0'
        },
        transactionId: 2866005
      }
    ]
  }
} as IOperation;

export default OPERATION_TOKEN_TRANSFER_ONLY;
