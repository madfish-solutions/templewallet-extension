const TOKEN_TRANSFER_FA2 = {
  destination: 'KT1RX7AdYr9hFZPQTZw5Fu8KkMwVtobHpTp6',
  parameters: {
    entrypoint: 'transfer',
    value: [
      {
        prim: 'Pair',
        args: [
          {
            string: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'
          },
          [
            {
              prim: 'Pair',
              args: [
                {
                  string: 'tz1R3sPNAYaH2ZbweLpvvBnnJHHh1Zt68t7D'
                },
                {
                  prim: 'Pair',
                  args: [
                    {
                      int: '0'
                    },
                    {
                      int: '500'
                    }
                  ]
                }
              ]
            }
          ]
        ]
      }
    ]
  }
};

export default TOKEN_TRANSFER_FA2;
