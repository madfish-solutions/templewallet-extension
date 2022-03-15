import OPERATION_COMPLEX from '../__mocks__/operation_0';
import OPERATION_TOKEN_TRANSFER_ONLY from '../__mocks__/operation_1';
import OPERATION_LOCAL_ONLY from '../__mocks__/operation_2';
import { parseOpStack } from '../opStack';
import { OpStackItemType } from '../types';

const ACCOUNT = 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o';

describe('Operation stack parsing', () => {
  it('parseOpStack complex', async () => {
    const opStack = parseOpStack(OPERATION_COMPLEX, ACCOUNT);

    expect(opStack).toStrictEqual([
      {
        type: OpStackItemType.TransferTo,
        to: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus'
      },
      {
        type: OpStackItemType.TransferFrom,
        from: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus'
      },
      {
        from: 'KT1GdCu6VyfijaARRx5tDPg4ZU2U8uQadBT4',
        type: OpStackItemType.TransferFrom
      },
      {
        type: OpStackItemType.Interaction,
        with: 'KT1DaKxkR1LdnXW1tr7yozdwEAiSQDpCLUBj',
        entrypoint: 'update_operators'
      },
      {
        type: OpStackItemType.Interaction,
        with: 'KT1GdCu6VyfijaARRx5tDPg4ZU2U8uQadBT4',
        entrypoint: 'tezToTokenPayment'
      },
      {
        type: OpStackItemType.Interaction,
        with: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus',
        entrypoint: 'tokenToTezPayment'
      },
      {
        type: OpStackItemType.Interaction,
        with: 'KT1DaKxkR1LdnXW1tr7yozdwEAiSQDpCLUBj',
        entrypoint: 'update_operators'
      }
    ]);
  });

  it('parseOpStack token transfer only', async () => {
    const opStack = parseOpStack(OPERATION_TOKEN_TRANSFER_ONLY, ACCOUNT);

    expect(opStack).toStrictEqual([
      {
        type: OpStackItemType.TransferFrom,
        from: 'tz1KoLibimdjUSfhrSpXwx4FhhhCq1JM5Etk'
      }
    ]);
  });

  it('parseOpStack local only', async () => {
    const opStack = parseOpStack(OPERATION_LOCAL_ONLY, ACCOUNT);

    expect(opStack).toStrictEqual([
      {
        type: OpStackItemType.TransferTo,
        to: 'tz1V8T96EJMiMFVyFkt3UakBegftGf5HfEuG'
      }
    ]);
  });
});
