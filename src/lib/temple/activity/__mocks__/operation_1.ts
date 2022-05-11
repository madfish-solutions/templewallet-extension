import { IOperation } from 'lib/temple/repo';

const OPERATION_TOKEN_TRANSFER_ONLY = {
  hash: 'ooB5B636cUpMqJV17Z3DSmgSqw9RvRKvt9vHsUwi3ghLBe3CzmC',
  chainId: 'NetXxkAx4woPLyu',
  members: ['tz1KoLibimdjUSfhrSpXwx4FhhhCq1JM5Etk', 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'],
  assetIds: ['KT1NbznEfpxZZyPUNcSWRm9Y8qZkdEgWEFaV_0'],
  addedAt: 1624346191000,
  data: {
    tzktTokenTransfers: [
      {
        amount: '11549918',
        from: { address: 'tz1h85hgb9hk4MmLuouLcWWna4wBLtqCq4Ta' },
        address: 'tz1h85hgb9hk4MmLuouLcWWna4wBLtqCq4Ta',
        id: 227013117,
        level: 2347253,
        timestamp: '2022-05-08T11:30:44Z',
        to: { alias: 'QuipuSwap wUSDC', address: 'KT1U2hs5eNdeCpHouAvQXGMzGFGJowbhjqmo' },
        token: {
          contract: { alias: 'Wrapped Tokens Contract', address: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ' },
          address: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
          alias: 'Wrapped Tokens Contract',
          id: 103879,
          metadata: { name: 'Wrapped USDC', symbol: 'wUSDC', decimals: '6' },
          standard: 'fa2',
          tokenId: '17'
        },
        transactionId: 227013081
      }
    ]
  }
} as IOperation;

export default OPERATION_TOKEN_TRANSFER_ONLY;
