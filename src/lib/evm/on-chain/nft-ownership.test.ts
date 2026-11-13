import { Hex, getAddress, toFunctionSelector } from 'viem';

import { readContractNftOwnership } from 'lib/evm/on-chain/nft-ownership';

const mockClient = {
  getCode: jest.fn(),
  multicall: jest.fn(),
  getStorageAt: jest.fn()
};

jest.mock('temple/evm', () => ({ getViemPublicClient: () => mockClient }));

const network = { chainId: 137, rpcBaseURL: 'https://polygon.example' };
const account = getAddress('0x00000000000000000000000000000000000000a1');
const other = getAddress('0x00000000000000000000000000000000000000b2');
const plain = getAddress('0x0000000000000000000000000000000000000001');
const proxy = getAddress('0x0000000000000000000000000000000000000002');
const implementation = getAddress('0x3333333333333333333333333333333333333333');

const withSelectors = (...signatures: string[]): Hex =>
  `0x${signatures.map(signature => toFunctionSelector(signature).slice(2)).join('00')}`;

const erc721Code = withSelectors(
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)'
);
const enumerableCode = withSelectors(
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)'
);
const listCode = withSelectors(
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokensOfOwner(address owner) view returns (uint256[])'
);
const erc1155Code = withSelectors(
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])'
);
const batchOnlyCode = withSelectors(
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])'
);

const minimalProxy = (destination: Hex): Hex =>
  `0x363d3d373d3d3d363d73${destination.slice(2).toLowerCase()}5af43d82803e903d91602b57fd5bf3`;

interface RecordedCall {
  address: string;
  functionName: string;
  args: readonly unknown[];
}

const { getCode, multicall, getStorageAt } = mockClient;
const recorded: RecordedCall[][] = [];
const balances = new Map<string, bigint>();
const owners = new Map<string, string>();
const lists = new Map<string, readonly string[]>();

const label = (call: RecordedCall) => {
  const args = call.args.map(arg => (typeof arg === 'bigint' ? arg.toString() : String(arg).toLowerCase())).join(',');

  return `${call.address.toLowerCase()}:${call.functionName}(${args})`;
};

const success = (result: unknown) => ({ status: 'success' as const, result });
const failure = () => ({ status: 'failure' as const, error: new Error('missing') });

const respond = (call: RecordedCall) => {
  const address = call.address.toLowerCase();
  if (call.functionName === 'balanceOf' && call.args.length === 1) {
    const balance = balances.get(address);

    return balance == null ? failure() : success(balance);
  }
  if (call.functionName === 'ownerOf') {
    const owner = owners.get(`${address}:${String(call.args[0])}`);

    return owner ? success(owner) : failure();
  }
  if (call.functionName === 'tokenOfOwnerByIndex') {
    const tokenId = lists.get(address)?.[Number(call.args[1])];

    return tokenId == null ? failure() : success(BigInt(tokenId));
  }
  if (call.functionName === 'tokensOfOwner') {
    const ids = lists.get(address);

    return ids ? success(ids.map(tokenId => BigInt(tokenId))) : failure();
  }
  if (call.functionName === 'balanceOfBatch') {
    const ids = call.args[1];
    if (!Array.isArray(ids)) return failure();

    return success(ids.map(tokenId => balances.get(`${address}:${String(tokenId)}`) ?? 0n));
  }
  if (call.functionName === 'balanceOf') {
    const balance = balances.get(`${address}:${String(call.args[1])}`);

    return balance == null ? failure() : success(balance);
  }

  return failure();
};

const mockCode = (codes: ReadonlyMap<string, Hex | 'fail'>) => {
  getCode.mockImplementation(async ({ address }: { address: string }) => {
    const bytecode = codes.get(address.toLowerCase());
    if (bytecode === 'fail') throw new Error('rpc down');

    return bytecode ?? '0x';
  });
};

const mockMulticall = () => {
  multicall.mockImplementation(async ({ contracts }: { contracts: readonly RecordedCall[] }) => {
    recorded.push(
      contracts.map(call => ({ address: call.address, functionName: call.functionName, args: [...call.args] }))
    );

    return contracts.map(respond);
  });
};

beforeEach(() => {
  recorded.length = 0;
  balances.clear();
  owners.clear();
  lists.clear();
  getCode.mockReset();
  multicall.mockReset();
  getStorageAt.mockReset();
  getStorageAt.mockRejectedValue(new Error('storage read was not expected'));
});

it('reads a plain contract and a minimal proxy in one multicall', async () => {
  mockCode(
    new Map<string, Hex>([
      [plain.toLowerCase(), erc721Code],
      [proxy.toLowerCase(), minimalProxy(implementation)],
      [implementation.toLowerCase(), erc721Code]
    ])
  );
  balances.set(plain.toLowerCase(), 2n);
  balances.set(proxy.toLowerCase(), 1n);
  owners.set(`${plain.toLowerCase()}:1`, account);
  owners.set(`${plain.toLowerCase()}:2`, other);
  owners.set(`${proxy.toLowerCase()}:7`, account);
  mockMulticall();

  const read = await readContractNftOwnership(
    network,
    account,
    [
      { contract: plain, tokenIds: ['1', '2'] },
      { contract: proxy, tokenIds: ['7'] }
    ],
    new AbortController().signal
  );

  expect(getStorageAt).not.toHaveBeenCalled();
  expect(getCode.mock.calls.map(call => String(call[0].address).toLowerCase()).sort()).toEqual(
    [plain, proxy, implementation].map(item => item.toLowerCase()).sort()
  );
  expect(recorded).toHaveLength(1);
  expect(recorded[0].map(label)).toEqual([
    `${plain.toLowerCase()}:balanceOf(${account.toLowerCase()})`,
    `${plain.toLowerCase()}:ownerOf(1)`,
    `${plain.toLowerCase()}:ownerOf(2)`,
    `${proxy.toLowerCase()}:balanceOf(${account.toLowerCase()})`,
    `${proxy.toLowerCase()}:ownerOf(7)`
  ]);
  expect(read.failed.size).toBe(0);
  const plainFacts = read.facts.get(plain.toLowerCase());
  const proxyFacts = read.facts.get(proxy.toLowerCase());
  expect(plainFacts?.balanceOf).toBe(2);
  expect(plainFacts?.enumeratedTokenIds).toBeNull();
  expect(plainFacts?.perTokenOwned.get('1')).toBe(true);
  expect(plainFacts?.perTokenOwned.get('2')).toBe(false);
  expect(proxyFacts?.balanceOf).toBe(1);
  expect(proxyFacts?.perTokenOwned.get('7')).toBe(true);
});

it('reads a 721 and a 1155 contract in the same multicall', async () => {
  const erc1155 = getAddress('0x0000000000000000000000000000000000000004');
  mockCode(
    new Map<string, Hex>([
      [plain.toLowerCase(), erc721Code],
      [erc1155.toLowerCase(), erc1155Code]
    ])
  );
  balances.set(plain.toLowerCase(), 1n);
  balances.set(`${erc1155.toLowerCase()}:3`, 2n);
  balances.set(`${erc1155.toLowerCase()}:4`, 0n);
  owners.set(`${plain.toLowerCase()}:9`, account);
  mockMulticall();

  const read = await readContractNftOwnership(
    network,
    account,
    [
      { contract: plain, tokenIds: ['9'] },
      { contract: erc1155, tokenIds: ['3', '4'] }
    ],
    new AbortController().signal
  );

  expect(recorded).toHaveLength(1);
  expect(recorded[0].map(call => `${call.address.toLowerCase()}:${call.functionName}`)).toEqual([
    `${plain.toLowerCase()}:balanceOf`,
    `${plain.toLowerCase()}:ownerOf`,
    `${erc1155.toLowerCase()}:balanceOfBatch`,
    `${erc1155.toLowerCase()}:balanceOf`,
    `${erc1155.toLowerCase()}:balanceOf`
  ]);
  expect(read.facts.get(plain.toLowerCase())?.perTokenOwned.get('9')).toBe(true);
  expect(read.facts.get(plain.toLowerCase())?.perTokenBalance.get('9')).toBe('1');
  expect(read.facts.get(erc1155.toLowerCase())?.balanceOf).toBeNull();
  expect(read.facts.get(erc1155.toLowerCase())?.perTokenOwned.get('3')).toBe(true);
  expect(read.facts.get(erc1155.toLowerCase())?.perTokenBalance.get('3')).toBe('2');
  expect(read.facts.get(erc1155.toLowerCase())?.perTokenOwned.get('4')).toBe(false);
  expect(read.facts.get(erc1155.toLowerCase())?.perTokenBalance.get('4')).toBe('0');
});

it('reads balanceOfBatch when the contract has no single balanceOf', async () => {
  const wearables = getAddress('0x0000000000000000000000000000000000000005');
  mockCode(new Map<string, Hex>([[wearables.toLowerCase(), batchOnlyCode]]));
  balances.set(`${wearables.toLowerCase()}:3`, 1n);
  balances.set(`${wearables.toLowerCase()}:4`, 0n);
  mockMulticall();

  const read = await readContractNftOwnership(
    network,
    account,
    [{ contract: wearables, tokenIds: ['3', '4'] }],
    new AbortController().signal
  );

  expect(recorded).toHaveLength(1);
  expect(recorded[0].map(call => call.functionName)).toEqual(['balanceOfBatch']);
  expect(read.facts.get(wearables.toLowerCase())?.balanceOf).toBeNull();
  expect(read.facts.get(wearables.toLowerCase())?.perTokenOwned.get('3')).toBe(true);
  expect(read.facts.get(wearables.toLowerCase())?.perTokenBalance.get('3')).toBe('1');
  expect(read.facts.get(wearables.toLowerCase())?.perTokenOwned.get('4')).toBe(false);
  expect(read.facts.get(wearables.toLowerCase())?.perTokenBalance.get('4')).toBe('0');
});

it('reads enumerable indexes for every short contract in one follow-up', async () => {
  const first = getAddress('0x0000000000000000000000000000000000000011');
  const second = getAddress('0x0000000000000000000000000000000000000022');
  mockCode(
    new Map<string, Hex>([
      [first.toLowerCase(), enumerableCode],
      [second.toLowerCase(), enumerableCode]
    ])
  );
  balances.set(first.toLowerCase(), 3n);
  balances.set(second.toLowerCase(), 1n);
  owners.set(`${first.toLowerCase()}:1`, account);
  owners.set(`${second.toLowerCase()}:4`, account);
  lists.set(first.toLowerCase(), ['1', '8', '9']);
  lists.set(second.toLowerCase(), ['4']);
  mockMulticall();

  const read = await readContractNftOwnership(
    network,
    account,
    [
      { contract: first, tokenIds: ['1'] },
      { contract: second, tokenIds: ['4'] }
    ],
    new AbortController().signal
  );

  expect(recorded).toHaveLength(2);
  expect(recorded[0].every(call => call.functionName !== 'tokenOfOwnerByIndex')).toBe(true);
  expect(recorded[1].map(label)).toEqual([
    `${first.toLowerCase()}:tokenOfOwnerByIndex(${account.toLowerCase()},0)`,
    `${first.toLowerCase()}:tokenOfOwnerByIndex(${account.toLowerCase()},1)`,
    `${first.toLowerCase()}:tokenOfOwnerByIndex(${account.toLowerCase()},2)`,
    `${second.toLowerCase()}:tokenOfOwnerByIndex(${account.toLowerCase()},0)`
  ]);
  expect(read.facts.get(first.toLowerCase())?.enumeratedTokenIds).toEqual(['1', '8', '9']);
  expect(read.facts.get(second.toLowerCase())?.enumeratedTokenIds).toEqual(['4']);
});

it('keeps tokensOfOwner when it matches the balance and skips indexes', async () => {
  mockCode(new Map<string, Hex>([[plain.toLowerCase(), listCode]]));
  balances.set(plain.toLowerCase(), 2n);
  owners.set(`${plain.toLowerCase()}:5`, account);
  owners.set(`${plain.toLowerCase()}:6`, account);
  lists.set(plain.toLowerCase(), ['5', '6']);
  mockMulticall();

  const read = await readContractNftOwnership(
    network,
    account,
    [{ contract: plain, tokenIds: ['5', '6'] }],
    new AbortController().signal
  );

  expect(recorded).toHaveLength(1);
  expect(recorded[0].some(call => call.functionName === 'tokensOfOwner')).toBe(true);
  expect(recorded[0].some(call => call.functionName === 'tokenOfOwnerByIndex')).toBe(false);
  expect(read.facts.get(plain.toLowerCase())?.enumeratedTokenIds).toEqual(['5', '6']);
});

it('drops an enumerable list that ownerOf contradicts', async () => {
  mockCode(new Map<string, Hex>([[plain.toLowerCase(), enumerableCode]]));
  balances.set(plain.toLowerCase(), 2n);
  owners.set(`${plain.toLowerCase()}:1`, account);
  owners.set(`${plain.toLowerCase()}:2`, other);
  lists.set(plain.toLowerCase(), ['1', '2']);
  mockMulticall();

  const read = await readContractNftOwnership(
    network,
    account,
    [{ contract: plain, tokenIds: ['1', '2'] }],
    new AbortController().signal
  );

  expect(read.facts.get(plain.toLowerCase())?.enumeratedTokenIds).toBeNull();
  expect(read.facts.get(plain.toLowerCase())?.perTokenOwned.get('1')).toBe(true);
  expect(read.facts.get(plain.toLowerCase())?.perTokenOwned.get('2')).toBe(false);
});

it('leaves a failed bytecode read unverified and still checks the other contract', async () => {
  mockCode(
    new Map<string, Hex | 'fail'>([
      [plain.toLowerCase(), 'fail'],
      [proxy.toLowerCase(), erc721Code]
    ])
  );
  balances.set(proxy.toLowerCase(), 1n);
  owners.set(`${proxy.toLowerCase()}:7`, account);
  mockMulticall();

  const read = await readContractNftOwnership(
    network,
    account,
    [
      { contract: plain, tokenIds: ['1'] },
      { contract: proxy, tokenIds: ['7'] }
    ],
    new AbortController().signal
  );

  expect(read.failed.has(plain.toLowerCase())).toBe(true);
  expect(read.facts.has(plain.toLowerCase())).toBe(false);
  expect(read.facts.get(proxy.toLowerCase())?.perTokenOwned.get('7')).toBe(true);
  expect(recorded).toHaveLength(1);
  expect(recorded[0].every(call => call.address.toLowerCase() !== plain.toLowerCase())).toBe(true);
});

it('splits a long ownerOf list across multicalls', async () => {
  mockCode(new Map([[plain.toLowerCase(), erc721Code]]));
  balances.set(plain.toLowerCase(), 90n);
  const tokenIds = Array.from({ length: 90 }, (_, index) => String(index + 1));
  owners.set(`${plain.toLowerCase()}:1`, account);
  owners.set(`${plain.toLowerCase()}:90`, other);
  mockMulticall();

  const read = await readContractNftOwnership(
    network,
    account,
    [{ contract: plain, tokenIds }],
    new AbortController().signal
  );

  expect(recorded).toHaveLength(2);
  expect(recorded[0]).toHaveLength(80);
  expect(recorded[1]).toHaveLength(11);
  expect(read.facts.get(plain.toLowerCase())?.balanceOf).toBe(90);
  expect(read.facts.get(plain.toLowerCase())?.perTokenOwned.get('1')).toBe(true);
  expect(read.facts.get(plain.toLowerCase())?.perTokenOwned.get('90')).toBe(false);
});

it('stops before bytecode reads when the signal is already aborted', async () => {
  await expect(
    readContractNftOwnership(network, account, [{ contract: plain, tokenIds: ['1'] }], AbortSignal.abort())
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect(getCode).not.toHaveBeenCalled();
});
