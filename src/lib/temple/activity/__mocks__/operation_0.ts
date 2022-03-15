import { IOperation } from 'lib/temple/repo';

const OPERATION_COMPLEX = {
  hash: 'opZG7XNt1wHxvLeUZxQ5WkKJZCm64kMjbUPeGS8BTiehB5pBYsX',
  chainId: 'NetXxkAx4woPLyu',
  members: [
    'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
    'KT1DaKxkR1LdnXW1tr7yozdwEAiSQDpCLUBj',
    'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus',
    'KT1GdCu6VyfijaARRx5tDPg4ZU2U8uQadBT4',
    'KT1P3RGEAa78XLTs3Hkpd1VWtryQRLDjiXqF'
  ],
  assetIds: ['tez', 'KT1DaKxkR1LdnXW1tr7yozdwEAiSQDpCLUBj_0', 'KT1P3RGEAa78XLTs3Hkpd1VWtryQRLDjiXqF_0'],
  addedAt: 1623672476381,
  data: {
    localGroup: [
      {
        kind: 'transaction',
        source: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
        fee: '0',
        counter: '23374',
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
                    {
                      string: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'
                    },
                    {
                      prim: 'Pair',
                      args: [
                        {
                          string: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus'
                        },
                        {
                          int: '0'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        metadata: {
          balance_updates: [],
          operation_result: {
            status: 'applied',
            storage: {
              prim: 'Pair',
              args: [
                {
                  prim: 'Pair',
                  args: [
                    {
                      int: '55772'
                    },
                    {
                      int: '55773'
                    }
                  ]
                },
                {
                  prim: 'Pair',
                  args: [
                    {
                      int: '55774'
                    },
                    {
                      int: '10000000'
                    }
                  ]
                }
              ]
            },
            big_map_diff: [
              {
                action: 'update',
                big_map: '55772',
                key_hash: 'exprumeTLDaGgTcpwDqcjEDgC5hVsZ5XP37YKGwtQKSZG6pxTL7jLi',
                key: {
                  bytes: '0000336496c0bf2665c71ccb84b02eefb8c54892fa8e'
                },
                value: {
                  prim: 'Pair',
                  args: [
                    [
                      {
                        bytes: '01ca40d457409ab6bb55b5e5d74f8834d1d2e6769200'
                      }
                    ],
                    {
                      int: '373'
                    }
                  ]
                }
              }
            ],
            balance_updates: [
              {
                kind: 'contract',
                contract: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
                change: '-6750',
                origin: 'block'
              }
            ],
            consumed_gas: '13110',
            consumed_milligas: '13109112',
            storage_size: '3432',
            paid_storage_size_diff: '27',
            lazy_storage_diff: [
              {
                kind: 'big_map',
                id: '55774',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55773',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55772',
                diff: {
                  action: 'update',
                  updates: [
                    {
                      key_hash: 'exprumeTLDaGgTcpwDqcjEDgC5hVsZ5XP37YKGwtQKSZG6pxTL7jLi',
                      key: {
                        bytes: '0000336496c0bf2665c71ccb84b02eefb8c54892fa8e'
                      },
                      value: {
                        prim: 'Pair',
                        args: [
                          [
                            {
                              bytes: '01ca40d457409ab6bb55b5e5d74f8834d1d2e6769200'
                            }
                          ],
                          {
                            int: '373'
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      },
      {
        kind: 'transaction',
        source: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
        fee: '0',
        counter: '23375',
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
                            args: [
                              {
                                int: '100'
                              },
                              {
                                int: '228627'
                              }
                            ]
                          },
                          {
                            string: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        metadata: {
          balance_updates: [],
          operation_result: {
            status: 'applied',
            storage: {
              prim: 'Pair',
              args: [
                {
                  prim: 'Pair',
                  args: [
                    {
                      int: '55778'
                    },
                    {
                      int: '55779'
                    }
                  ]
                },
                {
                  prim: 'Pair',
                  args: [
                    [
                      [
                        [
                          {
                            prim: 'Pair',
                            args: [
                              {
                                prim: 'Pair',
                                args: [
                                  {
                                    bytes: '0119d00773028d49ed79fe3e386cd25c4f6689219400'
                                  },
                                  {
                                    prim: 'None'
                                  }
                                ]
                              },
                              {
                                prim: 'Pair',
                                args: [
                                  {
                                    prim: 'None'
                                  },
                                  {
                                    int: '1621855973'
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            prim: 'Pair',
                            args: [
                              {
                                int: '1621846469'
                              },
                              {
                                int: '55780'
                              }
                            ]
                          },
                          {
                            int: '1624438469'
                          },
                          {
                            int: '0'
                          }
                        ],
                        {
                          prim: 'Pair',
                          args: [
                            {
                              prim: 'Pair',
                              args: [
                                {
                                  int: '0'
                                },
                                {
                                  int: '0'
                                }
                              ]
                            },
                            {
                              prim: 'Pair',
                              args: [
                                {
                                  int: '0'
                                },
                                {
                                  int: '3652992'
                                }
                              ]
                            }
                          ]
                        },
                        {
                          prim: 'Pair',
                          args: [
                            {
                              bytes: '0136c341898f60359ce51cdee61f1b18456f1ed80600'
                            },
                            {
                              int: '0'
                            }
                          ]
                        },
                        {
                          int: '1693'
                        },
                        {
                          int: '0'
                        }
                      ],
                      {
                        prim: 'Pair',
                        args: [
                          {
                            prim: 'Pair',
                            args: [
                              {
                                int: '1109875'
                              },
                              {
                                int: '0'
                              }
                            ]
                          },
                          {
                            prim: 'Pair',
                            args: [
                              {
                                int: '55781'
                              },
                              {
                                int: '0'
                              }
                            ]
                          }
                        ]
                      },
                      {
                        prim: 'Pair',
                        args: [
                          {
                            int: '55782'
                          },
                          {
                            int: '55783'
                          }
                        ]
                      },
                      {
                        int: '55784'
                      }
                    ],
                    {
                      int: '55785'
                    }
                  ]
                }
              ]
            },
            big_map_diff: [],
            consumed_gas: '39568',
            consumed_milligas: '39567423',
            storage_size: '30622',
            lazy_storage_diff: [
              {
                kind: 'big_map',
                id: '55785',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55784',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55783',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55782',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55781',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55780',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55779',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55778',
                diff: {
                  action: 'update',
                  updates: []
                }
              }
            ]
          },
          internal_operation_results: [
            {
              kind: 'transaction',
              source: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus',
              nonce: 1,
              amount: '0',
              destination: 'KT1DaKxkR1LdnXW1tr7yozdwEAiSQDpCLUBj',
              parameters: {
                entrypoint: 'transfer',
                value: [
                  {
                    prim: 'Pair',
                    args: [
                      {
                        bytes: '0000336496c0bf2665c71ccb84b02eefb8c54892fa8e'
                      },
                      [
                        {
                          prim: 'Pair',
                          args: [
                            {
                              bytes: '01ca40d457409ab6bb55b5e5d74f8834d1d2e6769200'
                            },
                            {
                              prim: 'Pair',
                              args: [
                                {
                                  int: '0'
                                },
                                {
                                  int: '100'
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    ]
                  }
                ]
              },
              result: {
                status: 'applied',
                storage: {
                  prim: 'Pair',
                  args: [
                    {
                      prim: 'Pair',
                      args: [
                        {
                          int: '55772'
                        },
                        {
                          int: '55773'
                        }
                      ]
                    },
                    {
                      prim: 'Pair',
                      args: [
                        {
                          int: '55774'
                        },
                        {
                          int: '10000000'
                        }
                      ]
                    }
                  ]
                },
                big_map_diff: [
                  {
                    action: 'update',
                    big_map: '55772',
                    key_hash: 'exprumeTLDaGgTcpwDqcjEDgC5hVsZ5XP37YKGwtQKSZG6pxTL7jLi',
                    key: {
                      bytes: '0000336496c0bf2665c71ccb84b02eefb8c54892fa8e'
                    },
                    value: {
                      prim: 'Pair',
                      args: [
                        [
                          {
                            bytes: '01ca40d457409ab6bb55b5e5d74f8834d1d2e6769200'
                          }
                        ],
                        {
                          int: '273'
                        }
                      ]
                    }
                  },
                  {
                    action: 'update',
                    big_map: '55772',
                    key_hash: 'exprvHgK4ktdqWmTzqqitpeGsmvN7X1J9NdvGsK5itSrzUnAxSfK2h',
                    key: {
                      bytes: '01ca40d457409ab6bb55b5e5d74f8834d1d2e6769200'
                    },
                    value: {
                      prim: 'Pair',
                      args: [
                        [],
                        {
                          int: '1693'
                        }
                      ]
                    }
                  }
                ],
                consumed_gas: '14109',
                consumed_milligas: '14108830',
                storage_size: '3432',
                lazy_storage_diff: [
                  {
                    kind: 'big_map',
                    id: '55774',
                    diff: {
                      action: 'update',
                      updates: []
                    }
                  },
                  {
                    kind: 'big_map',
                    id: '55773',
                    diff: {
                      action: 'update',
                      updates: []
                    }
                  },
                  {
                    kind: 'big_map',
                    id: '55772',
                    diff: {
                      action: 'update',
                      updates: [
                        {
                          key_hash: 'exprvHgK4ktdqWmTzqqitpeGsmvN7X1J9NdvGsK5itSrzUnAxSfK2h',
                          key: {
                            bytes: '01ca40d457409ab6bb55b5e5d74f8834d1d2e6769200'
                          },
                          value: {
                            prim: 'Pair',
                            args: [
                              [],
                              {
                                int: '1693'
                              }
                            ]
                          }
                        },
                        {
                          key_hash: 'exprumeTLDaGgTcpwDqcjEDgC5hVsZ5XP37YKGwtQKSZG6pxTL7jLi',
                          key: {
                            bytes: '0000336496c0bf2665c71ccb84b02eefb8c54892fa8e'
                          },
                          value: {
                            prim: 'Pair',
                            args: [
                              [
                                {
                                  bytes: '01ca40d457409ab6bb55b5e5d74f8834d1d2e6769200'
                                }
                              ],
                              {
                                int: '273'
                              }
                            ]
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            },
            {
              kind: 'transaction',
              source: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus',
              nonce: 0,
              amount: '228627',
              destination: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
              result: {
                status: 'applied',
                balance_updates: [
                  {
                    kind: 'contract',
                    contract: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus',
                    change: '-228627',
                    origin: 'block'
                  },
                  {
                    kind: 'contract',
                    contract: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
                    change: '228627',
                    origin: 'block'
                  }
                ],
                consumed_gas: '1427',
                consumed_milligas: '1427000'
              }
            }
          ]
        }
      },
      {
        kind: 'transaction',
        source: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
        fee: '0',
        counter: '23376',
        gas_limit: '52500',
        storage_limit: '75',
        amount: '228627',
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
                        args: [
                          {
                            int: '339'
                          },
                          {
                            string: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        metadata: {
          balance_updates: [],
          operation_result: {
            status: 'applied',
            storage: {
              prim: 'Pair',
              args: [
                {
                  prim: 'Pair',
                  args: [
                    {
                      int: '55739'
                    },
                    {
                      int: '55740'
                    }
                  ]
                },
                {
                  prim: 'Pair',
                  args: [
                    [
                      [
                        [
                          {
                            prim: 'Pair',
                            args: [
                              {
                                prim: 'Pair',
                                args: [
                                  {
                                    bytes: '0106ef29da191eddf85972592a40d9304a92e7f70900'
                                  },
                                  {
                                    prim: 'None'
                                  }
                                ]
                              },
                              {
                                prim: 'Pair',
                                args: [
                                  {
                                    prim: 'None'
                                  },
                                  {
                                    int: '1621857493'
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            prim: 'Pair',
                            args: [
                              {
                                int: '1621845739'
                              },
                              {
                                int: '55741'
                              }
                            ]
                          },
                          {
                            int: '1624437739'
                          },
                          {
                            int: '0'
                          }
                        ],
                        {
                          prim: 'Pair',
                          args: [
                            {
                              prim: 'Pair',
                              args: [
                                {
                                  int: '0'
                                },
                                {
                                  int: '0'
                                }
                              ]
                            },
                            {
                              prim: 'Pair',
                              args: [
                                {
                                  int: '0'
                                },
                                {
                                  int: '1948059'
                                }
                              ]
                            }
                          ]
                        },
                        {
                          prim: 'Pair',
                          args: [
                            {
                              bytes: '019e9c0b5c19b9c9dfa5ae0715ec6c1eb97d69c21300'
                            },
                            {
                              int: '2576'
                            }
                          ]
                        },
                        {
                          int: '0'
                        },
                        {
                          int: '1000498'
                        }
                      ],
                      {
                        prim: 'Pair',
                        args: [
                          {
                            prim: 'Pair',
                            args: [
                              {
                                int: '0'
                              },
                              {
                                int: '55742'
                              }
                            ]
                          },
                          {
                            prim: 'Pair',
                            args: [
                              {
                                int: '0'
                              },
                              {
                                int: '55743'
                              }
                            ]
                          }
                        ]
                      },
                      {
                        int: '55744'
                      },
                      {
                        int: '55745'
                      }
                    ],
                    {
                      int: '55746'
                    }
                  ]
                }
              ]
            },
            big_map_diff: [],
            balance_updates: [
              {
                kind: 'contract',
                contract: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
                change: '-228627',
                origin: 'block'
              },
              {
                kind: 'contract',
                contract: 'KT1GdCu6VyfijaARRx5tDPg4ZU2U8uQadBT4',
                change: '228627',
                origin: 'block'
              }
            ],
            consumed_gas: '40028',
            consumed_milligas: '40027021',
            storage_size: '30553',
            lazy_storage_diff: [
              {
                kind: 'big_map',
                id: '55746',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55745',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55744',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55743',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55742',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55741',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55740',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55739',
                diff: {
                  action: 'update',
                  updates: []
                }
              }
            ]
          },
          internal_operation_results: [
            {
              kind: 'transaction',
              source: 'KT1GdCu6VyfijaARRx5tDPg4ZU2U8uQadBT4',
              nonce: 2,
              amount: '0',
              destination: 'KT1P3RGEAa78XLTs3Hkpd1VWtryQRLDjiXqF',
              parameters: {
                entrypoint: 'transfer',
                value: {
                  prim: 'Pair',
                  args: [
                    {
                      bytes: '015836fc3ff4390e30ff74fd1a74d02cb6b9bf46ed00'
                    },
                    {
                      prim: 'Pair',
                      args: [
                        {
                          bytes: '0000336496c0bf2665c71ccb84b02eefb8c54892fa8e'
                        },
                        {
                          int: '341'
                        }
                      ]
                    }
                  ]
                }
              },
              result: {
                status: 'applied',
                storage: {
                  prim: 'Pair',
                  args: [
                    {
                      int: '55737'
                    },
                    {
                      int: '10000000'
                    }
                  ]
                },
                big_map_diff: [
                  {
                    action: 'update',
                    big_map: '55737',
                    key_hash: 'exprumeTLDaGgTcpwDqcjEDgC5hVsZ5XP37YKGwtQKSZG6pxTL7jLi',
                    key: {
                      bytes: '0000336496c0bf2665c71ccb84b02eefb8c54892fa8e'
                    },
                    value: {
                      prim: 'Pair',
                      args: [
                        [],
                        {
                          int: '341'
                        }
                      ]
                    }
                  },
                  {
                    action: 'update',
                    big_map: '55737',
                    key_hash: 'exprvNLVTq4JfjaC542Fnu7sDnKHPYKEFVyxqaXuMMD8kydNKvS7M5',
                    key: {
                      bytes: '015836fc3ff4390e30ff74fd1a74d02cb6b9bf46ed00'
                    },
                    value: {
                      prim: 'Pair',
                      args: [
                        [],
                        {
                          int: '2576'
                        }
                      ]
                    }
                  }
                ],
                balance_updates: [
                  {
                    kind: 'contract',
                    contract: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
                    change: '-18750',
                    origin: 'block'
                  }
                ],
                consumed_gas: '12373',
                consumed_milligas: '12372506',
                storage_size: '2231',
                paid_storage_size_diff: '75',
                lazy_storage_diff: [
                  {
                    kind: 'big_map',
                    id: '55737',
                    diff: {
                      action: 'update',
                      updates: [
                        {
                          key_hash: 'exprvNLVTq4JfjaC542Fnu7sDnKHPYKEFVyxqaXuMMD8kydNKvS7M5',
                          key: {
                            bytes: '015836fc3ff4390e30ff74fd1a74d02cb6b9bf46ed00'
                          },
                          value: {
                            prim: 'Pair',
                            args: [
                              [],
                              {
                                int: '2576'
                              }
                            ]
                          }
                        },
                        {
                          key_hash: 'exprumeTLDaGgTcpwDqcjEDgC5hVsZ5XP37YKGwtQKSZG6pxTL7jLi',
                          key: {
                            bytes: '0000336496c0bf2665c71ccb84b02eefb8c54892fa8e'
                          },
                          value: {
                            prim: 'Pair',
                            args: [
                              [],
                              {
                                int: '341'
                              }
                            ]
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        }
      },
      {
        kind: 'transaction',
        source: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
        fee: '500000',
        counter: '23377',
        gas_limit: '13296',
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
                    {
                      string: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'
                    },
                    {
                      prim: 'Pair',
                      args: [
                        {
                          string: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus'
                        },
                        {
                          int: '0'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        metadata: {
          balance_updates: [
            {
              kind: 'contract',
              contract: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
              change: '-500000',
              origin: 'block'
            },
            {
              kind: 'freezer',
              category: 'fees',
              delegate: 'tz1Ke2h7sDdakHJQh8WX4Z372du1KChsksyU',
              cycle: 128,
              change: '500000',
              origin: 'block'
            }
          ],
          operation_result: {
            status: 'applied',
            storage: {
              prim: 'Pair',
              args: [
                {
                  prim: 'Pair',
                  args: [
                    {
                      int: '55772'
                    },
                    {
                      int: '55773'
                    }
                  ]
                },
                {
                  prim: 'Pair',
                  args: [
                    {
                      int: '55774'
                    },
                    {
                      int: '10000000'
                    }
                  ]
                }
              ]
            },
            big_map_diff: [
              {
                action: 'update',
                big_map: '55772',
                key_hash: 'exprumeTLDaGgTcpwDqcjEDgC5hVsZ5XP37YKGwtQKSZG6pxTL7jLi',
                key: {
                  bytes: '0000336496c0bf2665c71ccb84b02eefb8c54892fa8e'
                },
                value: {
                  prim: 'Pair',
                  args: [
                    [],
                    {
                      int: '273'
                    }
                  ]
                }
              } as any
            ],
            consumed_gas: '13196',
            consumed_milligas: '13195554',
            storage_size: '3405',
            lazy_storage_diff: [
              {
                kind: 'big_map',
                id: '55774',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55773',
                diff: {
                  action: 'update',
                  updates: []
                }
              },
              {
                kind: 'big_map',
                id: '55772',
                diff: {
                  action: 'update',
                  updates: [
                    {
                      key_hash: 'exprumeTLDaGgTcpwDqcjEDgC5hVsZ5XP37YKGwtQKSZG6pxTL7jLi',
                      key: {
                        bytes: '0000336496c0bf2665c71ccb84b02eefb8c54892fa8e'
                      },
                      value: {
                        prim: 'Pair',
                        args: [
                          [],
                          {
                            int: '273'
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    ],
    tzktGroup: [
      {
        type: 'transaction',
        id: 2866008,
        level: 263965,
        timestamp: '2021-06-14T12:08:04Z',
        block: 'BMNEHzDdZLccdRFn7c7uwWoHR5mkSDH7eU8R4LsZJysu27Dn8nw',
        hash: 'opZG7XNt1wHxvLeUZxQ5WkKJZCm64kMjbUPeGS8BTiehB5pBYsX',
        counter: 23377,
        sender: {
          address: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'
        },
        gasLimit: 13296,
        gasUsed: 13196,
        storageLimit: 0,
        storageUsed: 0,
        bakerFee: 500000,
        storageFee: 0,
        allocationFee: 0,
        target: {
          address: 'KT1DaKxkR1LdnXW1tr7yozdwEAiSQDpCLUBj'
        },
        amount: 0,
        parameter: {
          entrypoint: 'update_operators',
          value: [
            {
              remove_operator: {
                owner: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
                operator: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus',
                token_id: '0'
              }
            }
          ]
        },
        status: 'applied',
        hasInternals: false,
        parameters:
          '{"entrypoint":"update_operators","value":[{"prim":"Right","args":[{"prim":"Pair","args":[{"string":"tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o"},{"prim":"Pair","args":[{"string":"KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus"},{"int":"0"}]}]}]}]}'
      },
      {
        type: 'transaction',
        id: 2866007,
        level: 263965,
        timestamp: '2021-06-14T12:08:04Z',
        block: 'BMNEHzDdZLccdRFn7c7uwWoHR5mkSDH7eU8R4LsZJysu27Dn8nw',
        hash: 'opZG7XNt1wHxvLeUZxQ5WkKJZCm64kMjbUPeGS8BTiehB5pBYsX',
        counter: 23376,
        initiator: {
          address: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'
        },
        sender: {
          address: 'KT1GdCu6VyfijaARRx5tDPg4ZU2U8uQadBT4'
        },
        nonce: 2,
        gasLimit: 0,
        gasUsed: 12373,
        storageLimit: 0,
        storageUsed: 75,
        bakerFee: 0,
        storageFee: 18750,
        allocationFee: 0,
        target: {
          address: 'KT1P3RGEAa78XLTs3Hkpd1VWtryQRLDjiXqF'
        },
        amount: 0,
        parameter: {
          entrypoint: 'transfer',
          value: {
            to: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
            from: 'KT1GdCu6VyfijaARRx5tDPg4ZU2U8uQadBT4',
            value: '341'
          }
        },
        status: 'applied',
        hasInternals: false,
        parameters:
          '{"entrypoint":"transfer","value":{"prim":"Pair","args":[{"bytes":"015836fc3ff4390e30ff74fd1a74d02cb6b9bf46ed00"},{"prim":"Pair","args":[{"bytes":"0000336496c0bf2665c71ccb84b02eefb8c54892fa8e"},{"int":"341"}]}]}}'
      },
      {
        type: 'transaction',
        id: 2866006,
        level: 263965,
        timestamp: '2021-06-14T12:08:04Z',
        block: 'BMNEHzDdZLccdRFn7c7uwWoHR5mkSDH7eU8R4LsZJysu27Dn8nw',
        hash: 'opZG7XNt1wHxvLeUZxQ5WkKJZCm64kMjbUPeGS8BTiehB5pBYsX',
        counter: 23376,
        sender: {
          address: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'
        },
        gasLimit: 52500,
        gasUsed: 40028,
        storageLimit: 75,
        storageUsed: 0,
        bakerFee: 0,
        storageFee: 0,
        allocationFee: 0,
        target: {
          address: 'KT1GdCu6VyfijaARRx5tDPg4ZU2U8uQadBT4'
        },
        amount: 228627,
        parameter: {
          entrypoint: 'tezToTokenPayment',
          value: {
            min_out: '339',
            receiver: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'
          }
        },
        status: 'applied',
        hasInternals: true,
        parameters:
          '{"entrypoint":"tezToTokenPayment","value":{"prim":"Pair","args":[{"int":"339"},{"string":"tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o"}]}}'
      },
      {
        type: 'transaction',
        id: 2866005,
        level: 263965,
        timestamp: '2021-06-14T12:08:04Z',
        block: 'BMNEHzDdZLccdRFn7c7uwWoHR5mkSDH7eU8R4LsZJysu27Dn8nw',
        hash: 'opZG7XNt1wHxvLeUZxQ5WkKJZCm64kMjbUPeGS8BTiehB5pBYsX',
        counter: 23375,
        initiator: {
          address: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'
        },
        sender: {
          address: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus'
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
        amount: 228627,
        status: 'applied',
        hasInternals: false
      },
      {
        type: 'transaction',
        id: 2866004,
        level: 263965,
        timestamp: '2021-06-14T12:08:04Z',
        block: 'BMNEHzDdZLccdRFn7c7uwWoHR5mkSDH7eU8R4LsZJysu27Dn8nw',
        hash: 'opZG7XNt1wHxvLeUZxQ5WkKJZCm64kMjbUPeGS8BTiehB5pBYsX',
        counter: 23375,
        initiator: {
          address: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'
        },
        sender: {
          address: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus'
        },
        nonce: 1,
        gasLimit: 0,
        gasUsed: 14109,
        storageLimit: 0,
        storageUsed: 0,
        bakerFee: 0,
        storageFee: 0,
        allocationFee: 0,
        target: {
          address: 'KT1DaKxkR1LdnXW1tr7yozdwEAiSQDpCLUBj'
        },
        amount: 0,
        parameter: {
          entrypoint: 'transfer',
          value: [
            {
              txs: [
                {
                  to_: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus',
                  amount: '100',
                  token_id: '0'
                }
              ],
              from_: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'
            }
          ]
        },
        status: 'applied',
        hasInternals: false,
        parameters:
          '{"entrypoint":"transfer","value":[{"prim":"Pair","args":[{"bytes":"0000336496c0bf2665c71ccb84b02eefb8c54892fa8e"},[{"prim":"Pair","args":[{"bytes":"01ca40d457409ab6bb55b5e5d74f8834d1d2e6769200"},{"prim":"Pair","args":[{"int":"0"},{"int":"100"}]}]}]]}]}'
      },
      {
        type: 'transaction',
        id: 2866003,
        level: 263965,
        timestamp: '2021-06-14T12:08:04Z',
        block: 'BMNEHzDdZLccdRFn7c7uwWoHR5mkSDH7eU8R4LsZJysu27Dn8nw',
        hash: 'opZG7XNt1wHxvLeUZxQ5WkKJZCm64kMjbUPeGS8BTiehB5pBYsX',
        counter: 23375,
        sender: {
          address: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'
        },
        gasLimit: 55204,
        gasUsed: 39568,
        storageLimit: 0,
        storageUsed: 0,
        bakerFee: 0,
        storageFee: 0,
        allocationFee: 0,
        target: {
          address: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus'
        },
        amount: 0,
        parameter: {
          entrypoint: 'tokenToTezPayment',
          value: {
            amount: '100',
            min_out: '228627',
            receiver: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'
          }
        },
        status: 'applied',
        hasInternals: true,
        parameters:
          '{"entrypoint":"tokenToTezPayment","value":{"prim":"Pair","args":[{"prim":"Pair","args":[{"int":"100"},{"int":"228627"}]},{"string":"tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o"}]}}'
      },
      {
        type: 'transaction',
        id: 2866002,
        level: 263965,
        timestamp: '2021-06-14T12:08:04Z',
        block: 'BMNEHzDdZLccdRFn7c7uwWoHR5mkSDH7eU8R4LsZJysu27Dn8nw',
        hash: 'opZG7XNt1wHxvLeUZxQ5WkKJZCm64kMjbUPeGS8BTiehB5pBYsX',
        counter: 23374,
        sender: {
          address: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o'
        },
        gasLimit: 13210,
        gasUsed: 13110,
        storageLimit: 27,
        storageUsed: 27,
        bakerFee: 0,
        storageFee: 6750,
        allocationFee: 0,
        target: {
          address: 'KT1DaKxkR1LdnXW1tr7yozdwEAiSQDpCLUBj'
        },
        amount: 0,
        parameter: {
          entrypoint: 'update_operators',
          value: [
            {
              add_operator: {
                owner: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
                operator: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus',
                token_id: '0'
              }
            }
          ]
        },
        status: 'applied',
        hasInternals: false,
        parameters:
          '{"entrypoint":"update_operators","value":[{"prim":"Left","args":[{"prim":"Pair","args":[{"string":"tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o"},{"prim":"Pair","args":[{"string":"KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus"},{"int":"0"}]}]}]}]}'
      }
    ],
    bcdTokenTransfers: [
      {
        indexed_time: 2420957,
        network: 'granadanet',
        contract: 'KT1DaKxkR1LdnXW1tr7yozdwEAiSQDpCLUBj',
        initiator: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus',
        hash: 'opZG7XNt1wHxvLeUZxQ5WkKJZCm64kMjbUPeGS8BTiehB5pBYsX',
        status: 'applied',
        timestamp: '2021-06-14T12:08:04Z',
        level: 263965,
        from: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
        to: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus',
        token_id: 0,
        amount: '100',
        counter: 23375,
        nonce: 1,
        parent: 'tokenToTezPayment',
        token: {
          contract: 'KT1DaKxkR1LdnXW1tr7yozdwEAiSQDpCLUBj',
          network: 'granadanet',
          token_id: 0
        },
        alias: 'Quipu Token'
      },
      {
        indexed_time: 2420958,
        network: 'granadanet',
        contract: 'KT1P3RGEAa78XLTs3Hkpd1VWtryQRLDjiXqF',
        initiator: 'KT1GdCu6VyfijaARRx5tDPg4ZU2U8uQadBT4',
        hash: 'opZG7XNt1wHxvLeUZxQ5WkKJZCm64kMjbUPeGS8BTiehB5pBYsX',
        status: 'applied',
        timestamp: '2021-06-14T12:08:04Z',
        level: 263965,
        from: 'KT1GdCu6VyfijaARRx5tDPg4ZU2U8uQadBT4',
        to: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
        token_id: 0,
        amount: '341',
        counter: 23376,
        nonce: 2,
        parent: 'tezToTokenPayment',
        token: {
          contract: 'KT1P3RGEAa78XLTs3Hkpd1VWtryQRLDjiXqF',
          network: 'granadanet',
          token_id: 0
        }
      }
    ]
  }
} as IOperation;

export default OPERATION_COMPLEX;
