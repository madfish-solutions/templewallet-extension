const TOKEN_TRANFER_FA1_2 = {
  destination: 'KT1NbznEfpxZZyPUNcSWRm9Y8qZkdEgWEFaV',
  parameters: {
    entrypoint: 'transfer',
    value: {
      prim: 'Pair',
      args: [
        {
          string: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'
        },
        {
          prim: 'Pair',
          args: [
            {
              string: 'tz1R3sPNAYaH2ZbweLpvvBnnJHHh1Zt68t7D'
            },
            {
              int: '10000000000000000000'
            }
          ]
        }
      ]
    }
  }
};

export default TOKEN_TRANFER_FA1_2;
