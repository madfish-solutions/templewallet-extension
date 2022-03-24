import BigNumber from 'bignumber.js';

export const transferImplicit = (key: string, mutez: BigNumber) => {
  return [
    { prim: 'DROP' },
    { prim: 'NIL', args: [{ prim: 'operation' }] },
    {
      prim: 'PUSH',
      args: [{ prim: 'key_hash' }, { string: key }]
    },
    { prim: 'IMPLICIT_ACCOUNT' },
    {
      prim: 'PUSH',
      args: [{ prim: 'mutez' }, { int: mutez.toFixed() }]
    },
    { prim: 'UNIT' },
    { prim: 'TRANSFER_TOKENS' },
    { prim: 'CONS' }
  ];
};

export const transferToContract = (key: string, mutez: BigNumber) => {
  return [
    { prim: 'DROP' },
    { prim: 'NIL', args: [{ prim: 'operation' }] },
    {
      prim: 'PUSH',
      args: [{ prim: 'address' }, { string: key }]
    },
    { prim: 'CONTRACT', args: [{ prim: 'unit' }] },
    [
      {
        prim: 'IF_NONE',
        args: [[[{ prim: 'UNIT' }, { prim: 'FAILWITH' }]], []]
      }
    ],
    {
      prim: 'PUSH',
      args: [{ prim: 'mutez' }, { int: `${mutez.toFixed()}` }]
    },
    { prim: 'UNIT' },
    { prim: 'TRANSFER_TOKENS' },
    { prim: 'CONS' }
  ];
};

export const setDelegate = (key: string) => {
  return [
    { prim: 'DROP' },
    { prim: 'NIL', args: [{ prim: 'operation' }] },
    {
      prim: 'PUSH',
      args: [{ prim: 'key_hash' }, { string: key }]
    },
    { prim: 'SOME' },
    { prim: 'SET_DELEGATE' },
    { prim: 'CONS' }
  ];
};
