import { fetchEvmCollectiblesMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { ContractInterfaceId, EvmAssetStandard } from 'lib/evm/types';
import { getIpfsGenericFile } from 'lib/utils/ipfs';

const mockClient = {
  chain: { id: 1 },
  multicall: jest.fn(),
  readContract: jest.fn()
};

jest.mock('temple/evm', () => ({ getViemPublicClient: () => mockClient }));

jest.mock('lib/utils/ipfs', () => {
  const actual = jest.requireActual('lib/utils/ipfs');

  return { ...actual, getIpfsGenericFile: jest.fn(), getIpfsGenericFileInBulk: jest.fn() };
});

const erc721 = '0x1111111111111111111111111111111111111111';
const erc1155 = '0x2222222222222222222222222222222222222222';
const unknown = '0x3333333333333333333333333333333333333333';
const network = { chainId: 1, rpcBaseURL: 'https://rpc.example' };

interface RecordedCall {
  address: string;
  functionName: string;
  args?: readonly unknown[];
}

const success = (result: unknown) => ({ status: 'success' as const, result });
const failure = () => ({ status: 'failure' as const, error: new Error('missing'), result: undefined });

const fileFor = (uri: string) => ({ data: { name: 'Item', image: `https://img.example/${encodeURIComponent(uri)}` } });

const isJestMock = (value: unknown): value is jest.Mock =>
  typeof value === 'function' && 'mockReset' in value && 'mockImplementation' in value;

describe('fetchEvmCollectiblesMetadataFromChain', () => {
  if (!isJestMock(getIpfsGenericFile)) throw new Error('IPFS file loader is not mocked');

  const fetchFile = getIpfsGenericFile;

  beforeEach(() => {
    mockClient.multicall.mockReset();
    mockClient.readContract.mockReset();
    fetchFile.mockReset();
    fetchFile.mockImplementation(async (uri: string) => fileFor(uri));
  });

  it('reads every contract call in one multicall and then fetches each metadata file', async () => {
    mockClient.multicall.mockImplementation(async ({ contracts }: { contracts: readonly RecordedCall[] }) =>
      contracts.map(call => {
        const interfaceId = String(call.args?.[0]);

        if (call.functionName === 'supportsInterface') {
          if (call.address === erc721 && interfaceId === ContractInterfaceId.ERC721) return success(true);
          if (call.address === erc1155 && interfaceId === ContractInterfaceId.ERC1155) return success(true);

          return success(false);
        }
        if (call.functionName === 'name') return success(call.address === erc721 ? 'Alphas' : 'Betas');
        if (call.functionName === 'symbol') return success('NFT');
        if (call.functionName === 'tokenURI' && call.address === erc721)
          return success(`ipfs://alpha/${call.args?.[0]}`);
        if (call.functionName === 'uri' && call.address === erc1155) return success('ipfs://beta/{id}');

        return failure();
      })
    );

    const loaded = await fetchEvmCollectiblesMetadataFromChain(network, [
      `${erc721}_1`,
      `${erc721}_2`,
      `${erc1155}_7`,
      `${unknown}_4`
    ]);

    expect(mockClient.multicall).toHaveBeenCalledTimes(1);
    const contracts: RecordedCall[] = mockClient.multicall.mock.calls[0][0].contracts;
    const contractCalls = contracts.filter(call => call.address === erc721 && call.functionName !== 'tokenURI');

    expect(contractCalls.filter(call => call.functionName === 'supportsInterface')).toHaveLength(2);
    expect(contractCalls.filter(call => call.functionName === 'name')).toHaveLength(1);
    expect(contracts.filter(call => call.functionName === 'tokenURI' && call.address === erc721)).toHaveLength(2);
    expect(fetchFile).toHaveBeenCalledTimes(3);
    expect(fetchFile).toHaveBeenCalledWith(`ipfs://beta/${(7).toString(16).padStart(64, '0')}`);
    expect(loaded.map(([slug, metadata]) => [slug, metadata?.standard, metadata?.name, metadata?.image])).toEqual([
      [`${erc721}_1`, EvmAssetStandard.ERC721, 'Alphas', fileFor('ipfs://alpha/1').data.image],
      [`${erc721}_2`, EvmAssetStandard.ERC721, 'Alphas', fileFor('ipfs://alpha/2').data.image],
      [
        `${erc1155}_7`,
        EvmAssetStandard.ERC1155,
        'Item',
        fileFor(`ipfs://beta/${(7).toString(16).padStart(64, '0')}`).data.image
      ],
      [`${unknown}_4`, undefined, undefined, undefined]
    ]);
  });

  it('reads each token on its own when multicall is unavailable', async () => {
    const contract = '0x4444444444444444444444444444444444444444';
    mockClient.multicall.mockRejectedValue(new Error('multicall unavailable'));
    mockClient.readContract.mockImplementation(async ({ functionName, args }: RecordedCall) => {
      if (functionName === 'supportsInterface') return args?.[0] === ContractInterfaceId.ERC721;
      if (functionName === 'name') return 'Fallback';
      if (functionName === 'symbol') return 'FB';
      if (functionName === 'tokenURI') return 'ipfs://fallback';

      throw new Error(functionName);
    });

    const loaded = await fetchEvmCollectiblesMetadataFromChain(network, [`${contract}_9`]);

    expect(mockClient.readContract).toHaveBeenCalled();
    expect(loaded).toEqual([
      [
        `${contract}_9`,
        expect.objectContaining({
          standard: EvmAssetStandard.ERC721,
          name: 'Fallback',
          metadataUri: 'ipfs://fallback',
          image: fileFor('ipfs://fallback').data.image
        })
      ]
    ]);
  });
});
