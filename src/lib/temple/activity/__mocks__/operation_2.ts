import { IOperation } from 'lib/temple/repo';

export const OPERATION_LOCAL_ONLY = {
  hash: 'onjWPMGLcFc27T9bGeNHj3Q7aW5un8ummhRAfS5B4y7c91bqcUP',
  chainId: 'NetXxkAx4woPLyu',
  members: ['tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o', 'tz1V8T96EJMiMFVyFkt3UakBegftGf5HfEuG'],
  assetIds: ['tez'],
  addedAt: 1624529654049,
  data: {
    localGroup: [
      {
        kind: 'transaction',
        source: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
        fee: '445',
        counter: '23379',
        gas_limit: '1527',
        storage_limit: '257',
        amount: '55000000',
        destination: 'tz1V8T96EJMiMFVyFkt3UakBegftGf5HfEuG',
        metadata: {
          balance_updates: [
            {
              kind: 'contract',
              contract: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
              change: '-445',
              origin: 'block'
            },
            {
              kind: 'freezer',
              category: 'fees',
              delegate: 'tz1Ke2h7sDdakHJQh8WX4Z372du1KChsksyU',
              cycle: 141,
              change: '445',
              origin: 'block'
            }
          ],
          operation_result: {
            status: 'applied',
            balance_updates: [
              {
                kind: 'contract',
                contract: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
                change: '-55000000',
                origin: 'block'
              } as any,
              {
                kind: 'contract',
                contract: 'tz1V8T96EJMiMFVyFkt3UakBegftGf5HfEuG',
                change: '55000000',
                origin: 'block'
              },
              {
                kind: 'contract',
                contract: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
                change: '-64250',
                origin: 'block'
              }
            ],
            consumed_gas: '1427',
            consumed_milligas: '1427000',
            allocated_destination_contract: true
          }
        }
      }
    ]
  }
} as IOperation;

export default OPERATION_LOCAL_ONLY;
