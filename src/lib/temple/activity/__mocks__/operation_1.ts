import { IOperation } from 'lib/temple/repo';

const OPERATION_TOKEN_TRANSFER_ONLY = {
  hash: 'ooB5B636cUpMqJV17Z3DSmgSqw9RvRKvt9vHsUwi3ghLBe3CzmC',
  chainId: 'NetXxkAx4woPLyu',
  members: ['tz1KoLibimdjUSfhrSpXwx4FhhhCq1JM5Etk', 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'],
  assetIds: ['KT1NbznEfpxZZyPUNcSWRm9Y8qZkdEgWEFaV_0'],
  addedAt: 1624346191000,
  data: {
    bcdTokenTransfers: [
      {
        indexed_time: 2736005,
        network: 'granadanet',
        contract: 'KT1NbznEfpxZZyPUNcSWRm9Y8qZkdEgWEFaV',
        initiator: 'tz1KoLibimdjUSfhrSpXwx4FhhhCq1JM5Etk',
        hash: 'ooB5B636cUpMqJV17Z3DSmgSqw9RvRKvt9vHsUwi3ghLBe3CzmC',
        status: 'applied',
        timestamp: '2021-06-22T07:16:31Z',
        level: 284496,
        from: 'tz1KoLibimdjUSfhrSpXwx4FhhhCq1JM5Etk',
        to: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
        token_id: 0,
        amount: '162162162162162160000',
        counter: 28265,
        token: {
          contract: 'KT1NbznEfpxZZyPUNcSWRm9Y8qZkdEgWEFaV',
          network: 'granadanet',
          token_id: 0,
          symbol: 'kDAO',
          name: 'Kolibri DAO',
          decimals: 18
        },
        alias: 'kDAO Token'
      }
    ]
  }
} as IOperation;

export default OPERATION_TOKEN_TRANSFER_ONLY;
