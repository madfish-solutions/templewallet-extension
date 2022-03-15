export const SWAP_OPERATIONS = {
  branch: 'BM74jDLTriKBwSvB1TVszL8BB2TdqQ1YnEFXc5kqYkV39xktmup',
  contents: [
    {
      kind: 'transaction',
      source: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
      fee: '1676',
      counter: '23381',
      gas_limit: '13210',
      storage_limit: '27',
      amount: '0',
      destination: 'KT1DaKxkR1LdnXW1tr7yozdwEAiSQDpCLUBj',
      parameters: {
        entrypoint: 'update_operators',
        value: [
          {
            prim: 'Left',
            args: [
              {
                prim: 'Pair',
                args: [
                  { string: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o' },
                  {
                    prim: 'Pair',
                    args: [{ string: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus' }, { int: '0' }]
                  }
                ]
              }
            ]
          }
        ]
      }
    },
    {
      kind: 'transaction',
      source: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
      fee: '5876',
      counter: '23382',
      gas_limit: '55204',
      storage_limit: '0',
      amount: '0',
      destination: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus',
      parameters: {
        entrypoint: 'use',
        value: {
          prim: 'Right',
          args: [
            {
              prim: 'Left',
              args: [
                {
                  prim: 'Left',
                  args: [
                    {
                      prim: 'Pair',
                      args: [
                        {
                          prim: 'Pair',
                          args: [{ int: '273' }, { int: '789964' }]
                        },
                        { string: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o' }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    },
    {
      kind: 'transaction',
      source: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
      fee: '5632',
      counter: '23383',
      gas_limit: '52770',
      storage_limit: '0',
      amount: '789964',
      destination: 'KT1GdCu6VyfijaARRx5tDPg4ZU2U8uQadBT4',
      parameters: {
        entrypoint: 'use',
        value: {
          prim: 'Left',
          args: [
            {
              prim: 'Right',
              args: [
                {
                  prim: 'Right',
                  args: [
                    {
                      prim: 'Pair',
                      args: [{ int: '672' }, { string: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o' }]
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    },
    {
      kind: 'transaction',
      source: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
      fee: '1685',
      counter: '23384',
      gas_limit: '13294',
      storage_limit: '0',
      amount: '0',
      destination: 'KT1DaKxkR1LdnXW1tr7yozdwEAiSQDpCLUBj',
      parameters: {
        entrypoint: 'update_operators',
        value: [
          {
            prim: 'Right',
            args: [
              {
                prim: 'Pair',
                args: [
                  { string: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o' },
                  {
                    prim: 'Pair',
                    args: [{ string: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus' }, { int: '0' }]
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  ]
};

export default SWAP_OPERATIONS;
