import { ActivityOperKindEnum, ActivityOperTransferType } from 'lib/activity';
import { TempleChainKind } from 'temple/types';

import { toFrontEvmActivity } from '..';
import { NO_TOKEN_ID_VALUE } from '../db';

import { vitalikPkhLowercased } from './common-evm-mocks';

describe('toFrontEvmActivity', () => {
  it('should transform activity without asset correctly', () => {
    expect(
      toFrontEvmActivity(
        {
          chain: TempleChainKind.EVM,
          hash: '0x3ae1cc6f7c9361d573eeede46c678cd2d0678f772b64ff37301f91efb520806d',
          addedAt: '2025-02-11T06:13:59.000Z',
          operationsCount: 1,
          chainId: 1,
          id: 1,
          blockHeight: 21821418,
          operations: [
            {
              kind: ActivityOperKindEnum.interaction,
              logIndex: 1029,
              // @ts-expect-error
              withAddress: 'mockAddress'
            }
          ],
          account: vitalikPkhLowercased,
          contract: ''
        },
        {}
      )
    ).toEqual({
      chain: TempleChainKind.EVM,
      hash: '0x3ae1cc6f7c9361d573eeede46c678cd2d0678f772b64ff37301f91efb520806d',
      addedAt: '2025-02-11T06:13:59.000Z',
      operationsCount: 1,
      chainId: 1,
      blockHeight: '21821418',
      operations: [
        {
          kind: ActivityOperKindEnum.interaction,
          logIndex: 1029,
          withAddress: 'mockAddress'
        }
      ]
    });
  });

  it('should transform activity with native token correctly', () => {
    const operation = {
      kind: ActivityOperKindEnum.transfer,
      type: ActivityOperTransferType.receiveFromAccount,
      fromAddress: '0x7bdbdb11808984bb80ba90bf6c7e71fa5024fed8',
      toAddress: '0xab5801a7d398351b8be11c439e05c5b3259aec9b',
      amountSigned: '112638000000000000',
      fkAsset: 1,
      logIndex: -1
    };
    expect(
      toFrontEvmActivity(
        {
          chain: TempleChainKind.EVM,
          chainId: 1,
          id: 1,
          hash: '0x84de2b9d66364cfee97172b35204e0538d73626555e0c36104801a6c00a363fe',
          addedAt: '2025-02-09T13:02:35.000Z',
          operations: [operation],
          operationsCount: 1,
          blockHeight: 21809128,
          account: vitalikPkhLowercased,
          contract: ''
        },
        {
          1: {
            contract: 'eth',
            symbol: 'ETH',
            decimals: 18,
            chainId: 1,
            tokenId: NO_TOKEN_ID_VALUE
          }
        }
      )
    ).toEqual({
      chain: TempleChainKind.EVM,
      chainId: 1,
      hash: '0x84de2b9d66364cfee97172b35204e0538d73626555e0c36104801a6c00a363fe',
      addedAt: '2025-02-09T13:02:35.000Z',
      operations: [
        {
          kind: ActivityOperKindEnum.transfer,
          type: ActivityOperTransferType.receiveFromAccount,
          fromAddress: '0x7bdbdb11808984bb80ba90bf6c7e71fa5024fed8',
          toAddress: '0xab5801a7d398351b8be11c439e05c5b3259aec9b',
          asset: {
            contract: 'eth',
            amountSigned: '112638000000000000',
            symbol: 'ETH',
            decimals: 18
          },
          logIndex: -1
        }
      ],
      operationsCount: 1,
      blockHeight: '21809128'
    });
  });

  it('should transform activity with ERC20 token correctly', () => {
    const operation = {
      kind: ActivityOperKindEnum.transfer,
      type: ActivityOperTransferType.receiveFromAccount,
      fromAddress: '0x3dbaf8e89fc8a12cbc5d7aea21bf6d3bf0b83815',
      toAddress: '0xab5801a7d398351b8be11c439e05c5b3259aec9b',
      logIndex: 1029,
      amountSigned: '11251326453126453120',
      fkAsset: 1
    };
    expect(
      toFrontEvmActivity(
        {
          chain: TempleChainKind.EVM,
          hash: '0x3ae1cc6f7c9361d573eeede46c678cd2d0678f772b64ff37301f91efb520806d',
          addedAt: '2025-02-11T06:13:59.000Z',
          operationsCount: 1,
          chainId: 1,
          id: 1,
          blockHeight: 21821418,
          operations: [operation],
          account: vitalikPkhLowercased,
          contract: ''
        },
        {
          1: {
            contract: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4',
            symbol: 'CODE AIAGENT',
            decimals: 8,
            iconURL: 'https://logos.covalenthq.com/tokens/1/0xe4e0dc08c6945ade56e8209e3473024abf29a9b4.png',
            chainId: 1,
            tokenId: NO_TOKEN_ID_VALUE
          }
        }
      )
    ).toEqual({
      chain: TempleChainKind.EVM,
      chainId: 1,
      hash: '0x3ae1cc6f7c9361d573eeede46c678cd2d0678f772b64ff37301f91efb520806d',
      addedAt: '2025-02-11T06:13:59.000Z',
      operations: [
        {
          kind: ActivityOperKindEnum.transfer,
          type: ActivityOperTransferType.receiveFromAccount,
          fromAddress: '0x3dbaf8e89fc8a12cbc5d7aea21bf6d3bf0b83815',
          toAddress: '0xab5801a7d398351b8be11c439e05c5b3259aec9b',
          asset: {
            contract: '0xe4e0dc08c6945ade56e8209E3473024ABF29A9b4',
            symbol: 'CODE AIAGENT',
            decimals: 8,
            iconURL: 'https://logos.covalenthq.com/tokens/1/0xe4e0dc08c6945ade56e8209e3473024abf29a9b4.png',
            amountSigned: '11251326453126453120'
          },
          logIndex: 1029
        }
      ],
      blockHeight: '21821418',
      operationsCount: 1
    });
  });

  it('should transform activity with NFT token correctly', () => {
    const operation = {
      kind: ActivityOperKindEnum.transfer,
      type: ActivityOperTransferType.receiveFromAccount,
      fromAddress: '0xf977814e90da44bfa03b6295a0616a897441acec',
      toAddress: '0xab5801a7d398351b8be11c439e05c5b3259aec9b',
      logIndex: 1520,
      amountSigned: '1',
      fkAsset: 1
    };
    expect(
      toFrontEvmActivity(
        {
          chain: TempleChainKind.EVM,
          hash: '0x1b060c295b4f6ea9ddfcca76739536e5f1bdb493c2f101389be7b60ef4d33901',
          addedAt: '2025-02-05T11:40:14.000Z',
          operationsCount: 1,
          chainId: 56,
          id: 1,
          blockHeight: 46391420,
          operations: [operation],
          account: vitalikPkhLowercased,
          contract: ''
        },
        {
          1: {
            contract: '0xd1ba52637f5c862780c20619c76229ccee65d470',
            tokenId: '1',
            decimals: 0,
            nft: true,
            iconURL: 'https://logos.covalenthq.com/tokens/56/0xd1ba52637f5c862780c20619c76229ccee65d470.png',
            chainId: 56
          }
        }
      )
    ).toEqual({
      chain: TempleChainKind.EVM,
      chainId: 56,
      hash: '0x1b060c295b4f6ea9ddfcca76739536e5f1bdb493c2f101389be7b60ef4d33901',
      addedAt: '2025-02-05T11:40:14.000Z',
      operations: [
        {
          kind: ActivityOperKindEnum.transfer,
          type: ActivityOperTransferType.receiveFromAccount,
          fromAddress: '0xf977814e90da44bfa03b6295a0616a897441acec',
          toAddress: '0xab5801a7d398351b8be11c439e05c5b3259aec9b',
          asset: {
            contract: '0xd1Ba52637f5c862780c20619C76229ccee65d470',
            tokenId: '1',
            amountSigned: '1',
            decimals: 0,
            nft: true,
            iconURL: 'https://logos.covalenthq.com/tokens/56/0xd1ba52637f5c862780c20619c76229ccee65d470.png'
          },
          logIndex: 1520
        }
      ],
      operationsCount: 1,
      blockHeight: '46391420'
    });
  });
});
