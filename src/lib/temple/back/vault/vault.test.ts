import { DerivationType } from '@taquito/ledger-signer';
import { TypedDataDefinition } from 'viem';
import browser from 'webextension-polyfill';

import {
  AT_LEAST_ONE_HD_ACCOUNT_ERR_MSG,
  ACCOUNT_NAME_COLLISION_ERR_MSG,
  ACCOUNT_ALREADY_EXISTS_ERR_MSG
} from 'lib/constants';
import { getAccountAddressForTezos } from 'temple/accounts';
import { TypedDataV1 } from 'temple/evm/typed-data-v1';
import { TempleChainKind } from 'temple/types';

import { TempleAccountType, TempleSettings } from '../../types';

import { setGeneratedMnemonicOnce } from './bip39.mock';
import { getPassHash } from './session-store';

import { Vault } from './index';

const password = 'Test123!';
const invalidPassword = 'Invalid123!';

const hdWallets = [
  {
    mnemonic: 'street seminar popular skill actress route treat coral ready bar program affair',
    accounts: [
      {
        tezos: {
          address: 'tz1fHq6qD2SxeBS6AK6i4PuTi9z8g8zVufa4',
          publicKey: 'edpktvUNeD81JHFVfTGzCz7KxgrSk4Kk9UrB5s9GQ3txuBauBnKn1p',
          privateKey: 'edsk2rUBH2pEiWunNetQmuBnPPQtNDBCd9RDELdb4yp13hdyiBMvkL'
        },
        evm: {
          address: '0xf4b75C898EA8DF5381b3e61edFa275F60f00f8a0',
          publicKey:
            '0x047f921835b85ee017eb7f5073440d2691d26080fcba92c09f20e12b04af58ea4faa26158c11af55dbdf64ddfa41bd4a81fa709c4d97d9e8397339e86ac8619719',
          privateKey: '0x50350ba45d7378c5d4d266f202d1623a9589d6d2efbd90e94e251f5f9b9fde98'
        }
      },
      {
        tezos: {
          address: 'tz1PedoTwKSyxvUcK7LoJQmifxz5Yg3MzDuD',
          publicKey: 'edpktugHAbXoPi9ViPD23cRutozoJ4f14t8AXTafCLBpFopYqBDh1d',
          privateKey: 'edsk3Tz3LPbUCZjBjjLF7pM6tPoejPDtS9rNmTHTi8Z1hwvMdpyT52'
        },
        evm: {
          address: '0x2bF2b91E6A3306D1846056641f78D783EcFa9DaB',
          publicKey:
            '0x042369a530899a046c40af2978f50073c570e859756a7627de93b23ab2438ad8ef470360d39075dc481e8c64ffab93343e895941fa6161553b12053c52a80aaa5b',
          privateKey: '0x661b5b83db5798ce7a013737b26732d840e3c90ea0c717138ff248512e479953'
        }
      },
      {
        tezos: {
          address: 'tz1VhWfNN1qUY5rNBUMiwmnTUzpTS31s1fZD',
          publicKey: 'edpkv6oFjAQEQC1WwDt8xCoj89QYSS45vgbRccQMpCdovXx3tDdKM1',
          privateKey: 'edsk2ypiTecjwn6sRGNtktSgC7rAYtDFwZoqEgSaNGFNa74HTQP3Jq'
        },
        evm: {
          address: '0x4B3A8Dbd5cfBF27D1845521070c0b5a8829A1faD',
          publicKey:
            '0x04152879ab8cfa25109952189f10e1ec43768da890a4d4762b4f09ef4b241f2a77ffd47cb554c20592f8f1b6cf46d1a3426a794ead2e226ad171c9cff8497d4c8d',
          privateKey: '0x4888da31aa62ec33a649fbd6dca6818271a13d6eaab737ebaafdd3f8b59d9b81'
        }
      },
      {
        tezos: {
          address: 'tz1caBENGo2ZedsCnm3twsxa9G6SBpdQBbSC',
          publicKey: 'edpktg8j1RzWbvb42FGV4igcDkwJF9U7yyjVCsfpAqHHQZ7AqwDxNB',
          privateKey: 'edsk2jSd3AvB9hcGVM9brHz3JpkeYBvjA5QTJwxY8DxUoKq6sJ12nc'
        },
        evm: {
          address: '0x3c53d0AE9C2B1461660ad6f04F0904C0F0638C59',
          publicKey:
            '0x04b5671a14005be5b05a86d8fde5bd2d80a841b37ad66816d97e7e30bb149e2b095615dad34afa0a791e6ed7aebde40314a73da64d85a8871ae318a8634dc62842',
          privateKey: '0x2d753d2d4cf0cd276851e5498dd0e6d66af4e8fd11cd4c10a7b73c37a8001e13'
        }
      }
    ]
  },
  {
    mnemonic: 'solar muffin month giggle series visa popular senior ribbon brave toast skirt',
    accounts: [
      {
        tezos: {
          address: 'tz1ZVW66VD5rxif5f3JkYsZsX2fMxQftHDgL',
          publicKey: 'edpkvVQdBWqZ9LoNqrZj85SA7Y9u8GWPsh7c6iDoiGscXM3KpVgsV2',
          privateKey: 'edsk4BxaEseQ5jfE4t591Jr15i6KAicD7BBSvx6YuLRM9HEb1G4TnT'
        },
        evm: {
          address: '0x097ad9db7a610dd117aA96EC954Ed1084514d5b8',
          publicKey:
            '0x040c7b0759b40bb4a5db11f654f17ccc539c6c218514e5b80e88ad6e7b991f41e949dade68577dede7bce99bd44c0a86e21c2908cc25677901dc0461755bb26a16',
          privateKey: '0xaa367208215dbe54b32dc4f4e89e8801c73391d8fce1167f768e02267469778f'
        }
      },
      {
        tezos: {
          address: 'tz1Sm2A5tTLASpHqLARVdY2RN8Az4m72QfHF',
          publicKey: 'edpkuvEQXPpnAod8a1woRDgeijUgY7mB7ypQ98rJbBNvmb76ChaYtg',
          privateKey: 'edsk3y5wEaYbxorCBCbZNVUbH8KVbfxHUJqEKGFXmD4eXYeAr1EHYJ'
        },
        evm: {
          address: '0x7F36b75bc0EE1F74C5743A38aaD599B975407570',
          publicKey:
            '0x042e8cf5b187f3844235616b6291e20307acea4c147f2712282bfc6ce0fb814e0e1260fbd8725bf85ca7059cbd3a63be1d05635f59153e39e9d127abdbd833b637',
          privateKey: '0x01b096e495dbe1c8f37b7885b03e1ccae451ea1d14db5353b67a744de91ae4ae'
        }
      }
    ]
  }
];

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
];
const typedDataV4: TypedDataDefinition = {
  domain: {
    chainId: 168587773,
    name: 'Ether Mail',
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    version: '1'
  },
  message: {
    contents: 'Hello, Bob!',
    from: {
      name: 'Cow',
      wallets: ['0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826', '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF']
    },
    to: [
      {
        name: 'Bob',
        wallets: [
          '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
          '0xB0B0b0b0b0b0B000000000000000000000000000'
        ]
      }
    ],
    attachment: '0x'
  },
  primaryType: 'Mail',
  types: {
    EIP712Domain,
    Group: [
      { name: 'name', type: 'string' },
      { name: 'members', type: 'Person[]' }
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person[]' },
      { name: 'contents', type: 'string' },
      { name: 'attachment', type: 'bytes' }
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallets', type: 'address[]' }
    ]
  }
};
const typedDataV3: TypedDataDefinition = {
  types: {
    EIP712Domain,
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' }
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' }
    ]
  },
  primaryType: 'Mail',
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 168587773,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
  },
  message: {
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826'
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
    },
    contents: 'Hello, Bob!'
  }
};

const typedDataV1: TypedDataV1 = [
  {
    type: 'string',
    name: 'Message',
    value: 'Hi, Alice!'
  },
  {
    type: 'uint32',
    name: 'A number',
    value: '1337'
  }
];

const mockBip39GeneratedMnemonic = 'avoid absorb sea someone blade right suspect fitness great flush accident laugh';

const defaultMnemonic = hdWallets[0].mnemonic;

const defaultCustomAccountName = 'Temple';
const mockManagedContractAddress = 'KT19txYWjVo4yLvcGnnyiGc35CuX12Pc4krn';
const defaultTestTimeout = 15000;

describe('Vault tests', () => {
  jest.setTimeout(defaultTestTimeout);

  beforeEach(async () => {
    await browser.storage.local.clear();
  });

  const expectObjectArrayMatch = <T extends object>(actual: T[], expected: Partial<T>[]) => {
    expect(actual).toHaveLength(expected.length);
    actual.forEach((item, i) => {
      expect(item).toMatchObject(expected[i]);
    });
  };

  const expectRecentTimestampInMs = (value: number) => {
    expect(value).toBeGreaterThan(Date.now() - defaultTestTimeout);
    expect(value).toBeLessThanOrEqual(Date.now());
  };

  it('init test', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const walletsSpecs = await vault.fetchWalletsSpecs();
    const values = Object.values(walletsSpecs);
    expectObjectArrayMatch(values, [{ name: 'Translated<hdWalletDefaultName, "A">' }]);
    expectRecentTimestampInMs(values[0].createdAt);
    const firstGroupId = Object.keys(walletsSpecs)[0];
    const accounts = await vault.createHDAccount(firstGroupId, defaultCustomAccountName);
    expectObjectArrayMatch(accounts, [
      {
        type: TempleAccountType.HD,
        name: 'Translated<defaultAccountName, "1">',
        hdIndex: 0,
        tezosAddress: hdWallets[0].accounts[0].tezos.address,
        evmAddress: hdWallets[0].accounts[0].evm.address,
        walletId: firstGroupId
      },
      {
        type: TempleAccountType.HD,
        name: defaultCustomAccountName,
        hdIndex: 1,
        tezosAddress: hdWallets[0].accounts[1].tezos.address,
        evmAddress: hdWallets[0].accounts[1].evm.address,
        walletId: firstGroupId
      }
    ]);
    expect(accounts[0].id).not.toBe(accounts[1].id);
  }, 20000);

  it('isExist test', async () => {
    expect(await Vault.isExist()).toBeFalsy();
    await Vault.spawn(password, defaultMnemonic);
    expect(await Vault.isExist()).toBeTruthy();
  });

  it('setup test', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    expect(vault).toBeDefined();
  });

  it('spawn test', async () => {
    await Vault.spawn(password, defaultMnemonic);
    expect(Vault.isExist()).toBeTruthy();
  });

  it('should reveal the mnemonic of the specified HD group', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const walletsSpecs = await vault.fetchWalletsSpecs();
    expect(await Vault.revealMnemonic(Object.keys(walletsSpecs)[0], password)).toBe(defaultMnemonic);
    await expect(() => Vault.revealMnemonic('invalidnanoid', password)).rejects.toThrow();
  });

  describe('revealPrivateKey', () => {
    it('should reveal the private key of the specified EVM account', async () => {
      await Vault.spawn(password, defaultMnemonic);
      await Vault.setup(password);
      const { address, privateKey } = hdWallets[0].accounts[0].evm;
      expect(await Vault.revealPrivateKey(address, password)).toEqual(privateKey);
    });

    it('should reveal the private key of the specified Tezos account', async () => {
      await Vault.spawn(password, defaultMnemonic);
      await Vault.setup(password);
      const { address, privateKey } = hdWallets[0].accounts[0].tezos;
      expect(await Vault.revealPrivateKey(address, password)).toEqual(privateKey);
    });
  });

  describe('revealPublicKey', () => {
    it('should reveal the public key of the specified EVM account', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const { address, publicKey } = hdWallets[0].accounts[0].evm;
      expect(await vault.revealPublicKey(address)).toEqual(publicKey);
    });

    it('should reveal the public key of the specified Tezos account', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const { address, publicKey } = hdWallets[0].accounts[0].tezos;
      expect(await vault.revealPublicKey(address)).toEqual(publicKey);
    });
  });

  it('should fetch all accounts', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts();
    expectObjectArrayMatch(accounts, [
      {
        type: TempleAccountType.HD,
        name: 'Translated<defaultAccountName, "1">',
        hdIndex: 0,
        tezosAddress: hdWallets[0].accounts[0].tezos.address,
        evmAddress: hdWallets[0].accounts[0].evm.address
      }
    ]);
  });

  it('should find the lowest available HD index but greater than the last one', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const firstGroupId = Object.keys(await vault.fetchWalletsSpecs())[0];
    await vault.createHDAccount(firstGroupId);
    expect(await vault.findFreeHDAccountIndex(firstGroupId)).toEqual({ hdIndex: 2, firstSkippedAccount: undefined });
    await vault.importAccount(TempleChainKind.Tezos, hdWallets[0].accounts[2].tezos.privateKey);
    await vault.importAccount(TempleChainKind.EVM, hdWallets[0].accounts[2].evm.privateKey);
    const { hdIndex, firstSkippedAccount } = await vault.findFreeHDAccountIndex(firstGroupId);
    expect(hdIndex).toBe(3);
    expect(firstSkippedAccount).toMatchObject({
      type: TempleAccountType.Imported,
      address: hdWallets[0].accounts[2].tezos.address
    });
  });

  describe('createHDAccount', () => {
    it('should fail if the specified group does not exist', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      await expect(vault.createHDAccount('invalidnanoid', defaultCustomAccountName)).rejects.toThrow(
        'Failed to create account'
      );
    });

    it('should fail if an account with the same name exists in the same group', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const walletsSpecs = await vault.fetchWalletsSpecs();
      const firstGroupId = Object.keys(walletsSpecs)[0];
      await vault.createHDAccount(firstGroupId, defaultCustomAccountName);
      await expect(vault.createHDAccount(firstGroupId, defaultCustomAccountName)).rejects.toThrow(
        ACCOUNT_NAME_COLLISION_ERR_MSG
      );
    });

    it('should fail if there is at least one non-HD account with the same Tezos address and HD index is specified', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const firstGroupId = Object.keys(await vault.fetchWalletsSpecs())[0];
      await vault.importAccount(TempleChainKind.Tezos, hdWallets[0].accounts[1].tezos.privateKey);

      await expect(() => vault.createHDAccount(firstGroupId, undefined, 1)).rejects.toThrow(
        ACCOUNT_ALREADY_EXISTS_ERR_MSG
      );
    });

    it('should fail if there is at least one non-HD account with the same EVM address and HD index is specified', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const firstGroupId = Object.keys(await vault.fetchWalletsSpecs())[0];
      await vault.importAccount(TempleChainKind.EVM, hdWallets[0].accounts[1].evm.privateKey);

      await expect(() => vault.createHDAccount(firstGroupId, undefined, 1)).rejects.toThrow(
        ACCOUNT_ALREADY_EXISTS_ERR_MSG
      );
    });

    it('should create an account if another one with the same name exists in another group', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      await vault.createOrImportWallet(hdWallets[1].mnemonic);
      const [firstGroupId, secondGroupId] = Object.keys(await vault.fetchWalletsSpecs());
      await vault.createHDAccount(firstGroupId, defaultCustomAccountName);
      await vault.createHDAccount(secondGroupId, defaultCustomAccountName);
      const accounts = await vault.fetchAccounts();
      expectObjectArrayMatch(accounts, [
        { type: TempleAccountType.HD, tezosAddress: hdWallets[0].accounts[0].tezos.address, walletId: firstGroupId },
        { type: TempleAccountType.HD, tezosAddress: hdWallets[1].accounts[0].tezos.address, walletId: secondGroupId },
        {
          type: TempleAccountType.HD,
          tezosAddress: hdWallets[0].accounts[1].tezos.address,
          walletId: firstGroupId,
          name: defaultCustomAccountName
        },
        {
          type: TempleAccountType.HD,
          tezosAddress: hdWallets[1].accounts[1].tezos.address,
          walletId: secondGroupId,
          name: defaultCustomAccountName
        }
      ]);
    });

    it('should create the 4th HD account given the 1st and the 3rd one', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const firstGroupId = Object.keys(await vault.fetchWalletsSpecs())[0];
      await vault.createHDAccount(firstGroupId);
      const accountsBeforeDeletion = await vault.createHDAccount(firstGroupId);
      await Vault.removeAccount(accountsBeforeDeletion[1].id, password);
      const accounts = await vault.createHDAccount(firstGroupId);
      expectObjectArrayMatch(accounts, [
        {
          type: TempleAccountType.HD,
          tezosAddress: hdWallets[0].accounts[0].tezos.address,
          evmAddress: hdWallets[0].accounts[0].evm.address,
          walletId: firstGroupId,
          id: accountsBeforeDeletion[0].id,
          name: 'Translated<defaultAccountName, "1">'
        },
        {
          type: TempleAccountType.HD,
          tezosAddress: hdWallets[0].accounts[2].tezos.address,
          evmAddress: hdWallets[0].accounts[2].evm.address,
          walletId: firstGroupId,
          id: accountsBeforeDeletion[2].id,
          name: 'Translated<defaultAccountName, "3">'
        },
        {
          type: TempleAccountType.HD,
          tezosAddress: hdWallets[0].accounts[3].tezos.address,
          evmAddress: hdWallets[0].accounts[3].evm.address,
          walletId: firstGroupId,
          name: 'Translated<defaultAccountName, "4">'
        }
      ]);
    }, 20000);

    it('should create an account with the specified name', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const firstGroupId = Object.keys(await vault.fetchWalletsSpecs())[0];
      const accounts = await vault.createHDAccount(firstGroupId, defaultCustomAccountName);
      expect(accounts[1]).toMatchObject({
        type: TempleAccountType.HD,
        name: defaultCustomAccountName
      });
    });

    it('should create an account with the specified HD index', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const firstGroupId = Object.keys(await vault.fetchWalletsSpecs())[0];
      const accounts = await vault.createHDAccount(firstGroupId, defaultCustomAccountName, 3);
      expect(accounts[1]).toMatchObject({
        type: TempleAccountType.HD,
        hdIndex: 3,
        tezosAddress: hdWallets[0].accounts[3].tezos.address,
        evmAddress: hdWallets[0].accounts[3].evm.address
      });
    });

    it('should create an account with the lowest available HD index but greater than the last one', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const firstGroupId = Object.keys(await vault.fetchWalletsSpecs())[0];
      await vault.importAccount(TempleChainKind.Tezos, hdWallets[0].accounts[1].tezos.privateKey);
      await vault.importAccount(TempleChainKind.EVM, hdWallets[0].accounts[2].evm.privateKey);
      const accounts = await vault.createHDAccount(firstGroupId);
      expect(accounts[3]).toMatchObject({
        type: TempleAccountType.HD,
        hdIndex: 3,
        tezosAddress: hdWallets[0].accounts[3].tezos.address,
        evmAddress: hdWallets[0].accounts[3].evm.address
      });
    });
  });

  it('should change the visibility of the specified account', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const firstGroupId = Object.keys(await vault.fetchWalletsSpecs())[0];
    const initialAccounts = await vault.createHDAccount(firstGroupId);
    const accountsV2 = await vault.setAccountHidden(initialAccounts[1].id, true);
    expectObjectArrayMatch(accountsV2, [{ id: initialAccounts[0].id }, { id: initialAccounts[1].id, hidden: true }]);
    const accountsV3 = await vault.setAccountHidden(initialAccounts[1].id, false);
    expectObjectArrayMatch(accountsV3, [{ id: initialAccounts[0].id }, { id: initialAccounts[1].id, hidden: false }]);
  });

  describe('editAccountName', () => {
    it('should throw an error if the specified account does not exist', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      await expect(() => vault.editAccountName('invalidnanoid', defaultCustomAccountName)).rejects.toThrow(
        'Account not found'
      );
    });

    it('should throw an error if an account with the same name exists in the same group', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const firstGroupId = Object.keys(await vault.fetchWalletsSpecs())[0];
      await vault.createHDAccount(firstGroupId, defaultCustomAccountName);
      const accounts = await vault.createHDAccount(firstGroupId);
      await expect(() => vault.editAccountName(accounts[2].id, defaultCustomAccountName)).rejects.toThrow(
        ACCOUNT_NAME_COLLISION_ERR_MSG
      );
    });

    it('should edit the name of the specified account', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const [{ id: accountId }] = await vault.fetchAccounts();
      const newAccounts = await vault.editAccountName(accountId, defaultCustomAccountName);
      expectObjectArrayMatch(newAccounts, [{ name: defaultCustomAccountName }]);
    });
  });

  it('should update settings', async () => {
    const contactsMock = [{ address: 'addressMock', name: 'nameMock' }];

    const newSettings: Partial<TempleSettings> = {
      contacts: contactsMock
    };
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const settings = await vault.updateSettings(newSettings);
    expect(settings.contacts).toBe(contactsMock);
  });

  describe('signing payload', () => {
    describe('for tz1 accounts', () => {
      it('should sign an arbitrary payload with 32 bytes key', async () => {
        await Vault.spawn(password, defaultMnemonic);
        const vault = await Vault.setup(password);
        const accounts = await vault.importAccount(
          TempleChainKind.Tezos,
          'edsk4TjJWEszkHKono7XMnepVqwi37FrpbVt1KCsifJeAGimxheShG'
        );
        const publicKeyHash = getAccountAddressForTezos(accounts[1])!;
        const result = await vault.sign(publicKeyHash, '1234');
        expect(result.sig).toBe(
          'sigpys8t3w9EGaLRsYsoGCNrpUdBQXpjufpaEA8ti5xSP1yYdxFBChDrDnKrcDFmLtvMBKYzWgk3dSgbej76gPW6HvEVnGNy'
        );
      });

      it('should sign an arbitrary payload with 64 bytes key', async () => {
        await Vault.spawn(password, defaultMnemonic);
        const vault = await Vault.setup(password);
        const accounts = await vault.importAccount(
          TempleChainKind.Tezos,
          'edskS3DtVSbWbPD1yviMGebjYwWJtruMjDcfAZsH9uba22EzKeYhmQkkraFosFETmEMfFNVcDYQ5QbFerj9ozDKroXZ6mb5oxV'
        );
        const publicKeyHash = getAccountAddressForTezos(accounts[1])!;
        const result = await vault.sign(publicKeyHash, '1234');
        expect(result.sig).toBe(
          'sigw9kKaD9FUiGhr2pSKdEFm9X8fTPVXbemqWUU3CYLsJQ9MhJhbyY6yK5MrvV143FgMyQF5qNSeHVV1EAA4TNjor3ThGDRW'
        );
      });
    });

    describe('for tz2 accounts', () => {
      it('should sign an arbitrary payload', async () => {
        await Vault.spawn(password, defaultMnemonic);
        const vault = await Vault.setup(password);
        const accounts = await vault.importAccount(
          TempleChainKind.Tezos,
          'spsk2rBDDeUqakQ42nBHDGQTtP3GErb6AahHPwF9bhca3Q5KA5HESE'
        );
        const publicKeyHash = getAccountAddressForTezos(accounts[1])!;
        const result = await vault.sign(publicKeyHash, '1234');
        expect(result.sig).toBe(
          'sigYv2Stb2x45tnDgWCGbzCafti8psCnEUi4eNjQ1EqNssiTcKtP2F4dtqnZCCS5T3X61rGhRSCCPxkZhLh8zkpcDE5UMMCD'
        );
      });

      it('should sign an arbitrary payload, public key needs padding', async () => {
        await Vault.spawn(password, defaultMnemonic);
        const vault = await Vault.setup(password);
        const accounts = await vault.importAccount(
          TempleChainKind.Tezos,
          'spsk33kCcKpgrvXRQJB2GVGxAMxrSEmwKXLh2KR4ztLcbaCnQq3FFs'
        );
        const publicKeyHash = getAccountAddressForTezos(accounts[1])!;
        const result = await vault.sign(publicKeyHash, '1234');
        expect(result.sig).toBe(
          'sigsWFKzoiZtikehVJZrsbMMWFSZbjW7uDriPTXpUDyqSVMprLrroG9G8dX62M91aQNpZTwZ8UWMMTniFSyBBksggcU4Nqd2'
        );
      });
    });

    describe('for tz3 accounts', () => {
      it('should sign an arbitrary payload', async () => {
        await Vault.spawn(password, defaultMnemonic);
        const vault = await Vault.setup(password);
        const accounts = await vault.importAccount(
          TempleChainKind.Tezos,
          'p2sk2obfVMEuPUnadAConLWk7Tf4Dt3n4svSgJwrgpamRqJXvaYcg1'
        );
        const publicKeyHash = getAccountAddressForTezos(accounts[1])!;
        const result = await vault.sign(publicKeyHash, '1234');
        expect(result.sig).toBe(
          'sigiZSgc352U4NzFXWcm7F8XmzXrqedsNzL3ifnJEU5FMjzZsjGYSswJBFAdLyFzxpGY5d1D8iMx7UgJp2WCWWDTNTQS9Bf5'
        );
      });

      it('should sign an arbitrary payload with an encrypted private key', async () => {
        await Vault.spawn(password, defaultMnemonic);
        const vault = await Vault.setup(password);
        const accounts = await vault.importAccount(
          TempleChainKind.Tezos,
          'p2esk2TFqgNcoT4u99ut5doGTUFNwo9x4nNvkpM6YMLqXrt4SbFdQnqLM3hoAXLMB2uZYazj6LZGvcoYzk16H6Et',
          'test1234'
        );
        const publicKeyHash = getAccountAddressForTezos(accounts[1])!;
        const result = await vault.sign(publicKeyHash, '1234', '0xFFFFFF');
        expect(result.sig).toBe(
          'sigXsCjs6LLoEXKx8DUrDqyLwdSFEgyVZjv54TED8fjxSpbRfMmAqYrz3wC3sCiDVumLHoty1xL7JFtetyAmSVnthEmCu3Pp'
        );
      });

      it('should sign an arbitrary payload, signature needs padding', async () => {
        await Vault.spawn(password, defaultMnemonic);
        const vault = await Vault.setup(password);
        const accounts = await vault.importAccount(
          TempleChainKind.Tezos,
          'p2sk2ke47zhFz3znRZj39TW5KKS9VgfU1Hax7KeErgnShNe9oQFQUP'
        );
        const publicKeyHash = getAccountAddressForTezos(accounts[1])!;
        const result = await vault.sign(publicKeyHash, '1234');
        expect(result.sig).toBe(
          'sighPNR73p7peCRZuJPpqhRyQrZcyNcGGdqy4v95SQFJKmQXHoxPvxZE6mkA85GVaQDCR6hw6fpVBRRzpzrzyN1CJY5K8Mnn'
        );
        const publicKeyHashTwo = publicKeyHash;
        const result2 = await vault.sign(
          publicKeyHashTwo,
          '03051d7ba791fbe8ccfb6f83dd9c760db5642358909eede2a915a26275e6880b9a6c02a2dea17733a2ef2685e5511bd3f160fd510fea7db50edd8122997800c0843d016910882a9436c31ce1d51570e21ae277bb8d91b800006c02a2dea17733a2ef2685e5511bd3f160fd510fea7df416de812294cd010000016910882a9436c31ce1d51570e21ae277bb8d91b800ff020000004602000000410320053d036d0743035d0100000024747a31655935417161316b5844466f6965624c3238656d7958466f6e65416f5667317a68031e0743036a0032034f034d031b6c02a2dea17733a2ef2685e5511bd3f160fd510fea7dd016df8122a6ca010000016910882a9436c31ce1d51570e21ae277bb8d91b800ff020000003e02000000390320053d036d0743035d0100000024747a3161575850323337424c774e484a6343443462334475744365766871713254315a390346034e031b6c02a2dea17733a2ef2685e5511bd3f160fd510fea7dc916e08122dec9010000016910882a9436c31ce1d51570e21ae277bb8d91b800ff0200000013020000000e0320053d036d053e035d034e031b'
        );
        expect(result2.prefixSig).toBe(
          'p2sigMMsHbzzKh6Eg3cDxfLURiUpTMkyjyPWd7RFtBUH7ZyGBzBqMZH9xZc16akQWZNKkCMHnf1vYjjckPEfru456ikHaFWXFD'
        );
      });
    });

    describe('for tz4 accounts', () => {
      it('should sign an arbitrary payload', async () => {
        await Vault.spawn(password, defaultMnemonic);
        const vault = await Vault.setup(password);
        const accounts = await vault.importAccount(
          TempleChainKind.Tezos,
          'BLsk2zk6pBGysG9BJn4u3XNtFnJQ1wpUYz6sQMTZQdfxQaiBWkqLyh'
        );
        const publicKeyHash = getAccountAddressForTezos(accounts[1])!;
        const result = await vault.sign(publicKeyHash, '1234');
        expect(result.sig).toBe(
          'G4s3TfXx9k8kUiyYRcpgrS1KircWudnePq5Jp8wk5TtU6wmvCvFd3gFxjyDMpj4kWwTgKpAvS4a2E8wM5iwyUnhL1ut1kWtmi7TZjdmsLRnFireNkr68NTHaFKm1YmUUk4zuCrDDGsdG'
        );
      });

      // TODO: add other test cases when they appear in Taquito codebase
    });
  });

  describe('should import an account by seed phrase', () => {
    describe('Tezos accounts', () => {
      it('should import the first account with password derivation', async () => {
        await Vault.spawn(password, defaultMnemonic);
        const vault = await Vault.setup(password);
        const [, newAccount] = await vault.importMnemonicAccount(hdWallets[1].mnemonic, password);
        expect(newAccount).toMatchObject({
          type: TempleAccountType.Imported,
          chain: TempleChainKind.Tezos,
          address: 'tz1N8eG6d2d3kizZoCZS2xBt3J14t5PAWnCV'
        });
      });

      it('should import an account by derivation path', async () => {
        await Vault.spawn(password, defaultMnemonic);
        const vault = await Vault.setup(password);
        const [, newAccount] = await vault.importMnemonicAccount(hdWallets[1].mnemonic, undefined, "m/44'/1729'/1'/0'");
        expect(newAccount).toMatchObject({
          type: TempleAccountType.Imported,
          chain: TempleChainKind.Tezos,
          address: hdWallets[1].accounts[1].tezos.address
        });
      });

      it('should import an account by derivation path and password', async () => {
        await Vault.spawn(password, defaultMnemonic);
        const vault = await Vault.setup(password);
        const [, newAccount] = await vault.importMnemonicAccount(hdWallets[1].mnemonic, password, "m/44'/1729'/1'/0'");
        expect(newAccount).toMatchObject({
          type: TempleAccountType.Imported,
          chain: TempleChainKind.Tezos,
          address: 'tz1b8uyMJ3mo87LMtijUcjjP3xm1MzCihUi8'
        });
      });
    });

    describe('EVM accounts', () => {
      it('should import an account if EVM derivation path is specified', async () => {
        await Vault.spawn(password, defaultMnemonic);
        const vault = await Vault.setup(password);
        const [, newAccount] = await vault.importMnemonicAccount(hdWallets[1].mnemonic, undefined, "m/44'/60'/0'/0/1");
        expect(newAccount).toMatchObject({
          type: TempleAccountType.Imported,
          chain: TempleChainKind.EVM,
          address: hdWallets[1].accounts[1].evm.address
        });
      });

      it('should import an account if EVM derivation path and password are specified', async () => {
        await Vault.spawn(password, defaultMnemonic);
        const vault = await Vault.setup(password);
        const [, newAccount] = await vault.importMnemonicAccount(hdWallets[1].mnemonic, password, "m/44'/60'/0'/0/1");
        expect(newAccount).toMatchObject({
          type: TempleAccountType.Imported,
          chain: TempleChainKind.EVM,
          address: '0xe59EaA7f2f6425712a2b6556a0fbA00bca61F802'
        });
      });
    });
  });

  it('should import an account by Tezos private key', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.importAccount(
      TempleChainKind.Tezos,
      'edskS3DtVSbWbPD1yviMGebjYwWJtruMjDcfAZsH9uba22EzKeYhmQkkraFosFETmEMfFNVcDYQ5QbFerj9ozDKroXZ6mb5oxV'
    );
    expect(accounts[1]).toMatchObject({
      name: 'Translated<defaultAccountName, "1">',
      type: TempleAccountType.Imported,
      chain: TempleChainKind.Tezos,
      address: 'tz1RvhdZ5pcjD19vCCK9PgZpnmErTba3dsBs'
    });
  });

  it('should import an account by EVM private key', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.importAccount(TempleChainKind.EVM, hdWallets[0].accounts[1].evm.privateKey);
    expect(accounts[1]).toMatchObject({
      type: TempleAccountType.Imported,
      chain: TempleChainKind.EVM,
      address: hdWallets[0].accounts[1].evm.address
    });
  });

  it('should import a watch-only account', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const [, newAccount] = await vault.importWatchOnlyAccount(TempleChainKind.Tezos, mockManagedContractAddress);
    expect(newAccount).toMatchObject({
      type: TempleAccountType.WatchOnly,
      name: 'Translated<defaultWatchOnlyAccountName, "1">',
      chain: TempleChainKind.Tezos,
      address: mockManagedContractAddress
    });
  });

  it('should import a Tezos Ledger account with known credentials', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const { publicKey, address } = hdWallets[0].accounts[1].tezos;
    const { publicKey: publicKey2, address: address2 } = hdWallets[0].accounts[2].tezos;
    const [, newAccount] = await vault.createLedgerAccount({
      derivationPath: 'mockTezosDerivationPath',
      chain: TempleChainKind.EVM,
      name: 'mockName',
      address,
      publicKey
    });
    const [, , newAccount2] = await vault.createLedgerAccount({
      derivationPath: 'mockTezosDerivationPath2',
      chain: TempleChainKind.Tezos,
      name: 'mockName2',
      address: address2,
      publicKey: publicKey2,
      derivationType: DerivationType.BIP32_ED25519
    });
    expect(newAccount).toMatchObject({
      type: TempleAccountType.Ledger,
      name: 'mockName',
      derivationPath: 'mockTezosDerivationPath',
      address
    });
    expect(newAccount2).toMatchObject({
      type: TempleAccountType.Ledger,
      name: 'mockName2',
      derivationPath: 'mockTezosDerivationPath2',
      derivationType: DerivationType.BIP32_ED25519,
      address: address2
    });
  });

  it('should not import an account with the same address', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    await vault.importWatchOnlyAccount(TempleChainKind.Tezos, mockManagedContractAddress);
    await expect(() => vault.importWatchOnlyAccount(TempleChainKind.Tezos, mockManagedContractAddress)).rejects.toThrow(
      'Account already exists'
    );
  });

  describe('removeAccount', () => {
    it('should throw an error in case the specified account does not exist', async () => {
      await Vault.spawn(password, defaultMnemonic);
      await Vault.setup(password);
      await expect(() => Vault.removeAccount('invalidnanoid', password)).rejects.toThrow('Failed to remove account');
    });

    it('should throw an error for an attempt to remove the only HD account', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const [hdAccount] = await vault.importAccount(TempleChainKind.Tezos, hdWallets[0].accounts[1].tezos.privateKey);
      await expect(() => Vault.removeAccount(hdAccount.id, password)).rejects.toThrow(AT_LEAST_ONE_HD_ACCOUNT_ERR_MSG);
    });

    it('should remove an HD account and its HD group if it becomes empty', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const { newWalletsSpecs: walletsSpecsBeforeDeletion } = await vault.createOrImportWallet();
      const [firstGroupId, secondGroupId] = Object.keys(walletsSpecsBeforeDeletion);
      const accountsBeforeDeletion = await vault.createHDAccount(secondGroupId);
      const { newAccounts: accountsV2, newWalletsSpecs: walletsSpecsV2 } = await Vault.removeAccount(
        accountsBeforeDeletion[1].id,
        password
      );
      expect(walletsSpecsV2).toEqual(walletsSpecsBeforeDeletion);
      expect(accountsV2).toEqual([accountsBeforeDeletion[0], accountsBeforeDeletion[2]]);
      const { newAccounts: accountsV3, newWalletsSpecs: walletsSpecsV3 } = await Vault.removeAccount(
        accountsBeforeDeletion[2].id,
        password
      );
      expect(walletsSpecsV3).toEqual({ [firstGroupId]: walletsSpecsBeforeDeletion[firstGroupId] });
      expect(accountsV3).toEqual([accountsBeforeDeletion[0]]);
    });

    it('should remove an imported account', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const accountsBeforeDeletion = await vault.importAccount(
        TempleChainKind.Tezos,
        hdWallets[0].accounts[1].tezos.privateKey
      );
      const { newAccounts: accountsAfterDeletion } = await Vault.removeAccount(accountsBeforeDeletion[1].id, password);
      expect(accountsAfterDeletion).toEqual([accountsBeforeDeletion[0]]);
    });
  });

  describe('removeHdWallet', () => {
    it('should throw an error if the specified group does not exist', async () => {
      await Vault.spawn(password, defaultMnemonic);
      await Vault.setup(password);
      await expect(() => Vault.removeHdWallet('invalidnanoid', password)).rejects.toThrow();
    });

    it('should throw an error on an attempt to remove the only HD group', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const firstGroupId = Object.keys(await vault.fetchWalletsSpecs())[0];
      await expect(() => Vault.removeHdWallet(firstGroupId, password)).rejects.toThrow(AT_LEAST_ONE_HD_ACCOUNT_ERR_MSG);
    });

    it('should remove the specified HD group and its accounts', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const { newWalletsSpecs: walletsSpecsBeforeDeletion } = await vault.createOrImportWallet();
      const [firstGroupId, secondGroupId] = Object.keys(walletsSpecsBeforeDeletion);
      const accountsBeforeDeletion = await vault.createHDAccount(secondGroupId);
      const { newAccounts: accountsV2, newWalletsSpecs: walletsSpecsV2 } = await Vault.removeHdWallet(
        secondGroupId,
        password
      );
      expect(walletsSpecsV2).toEqual({ [firstGroupId]: walletsSpecsBeforeDeletion[firstGroupId] });
      expect(accountsV2).toEqual([accountsBeforeDeletion[0]]);
    });
  });

  it('should remove accounts of the specified type, except the HD ones', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    await vault.importAccount(TempleChainKind.Tezos, hdWallets[0].accounts[1].tezos.privateKey);
    await vault.importAccount(TempleChainKind.EVM, hdWallets[0].accounts[1].evm.privateKey);
    await vault.importWatchOnlyAccount(TempleChainKind.Tezos, hdWallets[0].accounts[2].tezos.address);
    const accountsBeforeDeletion = await vault.fetchAccounts();
    const accountsWithoutImported = await Vault.removeAccountsByType(TempleAccountType.Imported, password);
    expect(accountsWithoutImported).toEqual([accountsBeforeDeletion[0], accountsBeforeDeletion[3]]);
    const accountsWithoutWatchOnly = await Vault.removeAccountsByType(TempleAccountType.WatchOnly, password);
    expect(accountsWithoutWatchOnly).toEqual([accountsBeforeDeletion[0]]);
  });

  it('should fetch all HD groups', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const walletsSpecs = await vault.fetchWalletsSpecs();
    const values = Object.values(walletsSpecs);
    expectObjectArrayMatch(values, [{ name: 'Translated<hdWalletDefaultName, "A">' }]);
    expectRecentTimestampInMs(values[0].createdAt);
  });

  describe('createOrImportWallet', () => {
    it('should throw an error on an attempt to import a wallet with the same mnemonic', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const firstGroupId = Object.keys(await vault.fetchWalletsSpecs())[0];
      const [firstAccount] = await vault.createHDAccount(firstGroupId);
      await Vault.removeAccount(firstAccount.id, password);
      await expect(() => vault.createOrImportWallet(defaultMnemonic)).rejects.toThrow(
        'This wallet is already imported'
      );
    });

    it('should use a mnemonic generated by "bip39" if it is not specified', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      setGeneratedMnemonicOnce(mockBip39GeneratedMnemonic);
      const { newWalletsSpecs } = await vault.createOrImportWallet();
      const [, secondGroupId] = Object.keys(newWalletsSpecs);
      const generatedMnemonic = await Vault.revealMnemonic(secondGroupId, password);
      expect(generatedMnemonic).toBe(mockBip39GeneratedMnemonic);
    });

    it('should use the specified mnemonic', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const { newWalletsSpecs } = await vault.createOrImportWallet(hdWallets[1].mnemonic);
      const [, secondGroupId] = Object.keys(newWalletsSpecs);
      const importedMnemonic = await Vault.revealMnemonic(secondGroupId, password);
      expect(importedMnemonic).toBe(hdWallets[1].mnemonic);
    });

    it('should replace non-HD accounts with the same addresses and borrow the name of the first replaced account', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const [, oldSecondAccount] = await vault.importAccount(
        TempleChainKind.Tezos,
        hdWallets[1].accounts[0].tezos.privateKey
      );
      await vault.editAccountName(oldSecondAccount.id, defaultCustomAccountName);
      await vault.importWatchOnlyAccount(TempleChainKind.EVM, hdWallets[1].accounts[0].evm.address);
      const accountsBeforeReplacement = await vault.importAccount(
        TempleChainKind.Tezos,
        hdWallets[0].accounts[2].tezos.privateKey
      );
      const { newWalletsSpecs, newAccounts: accounts } = await vault.createOrImportWallet(hdWallets[1].mnemonic);
      const values = Object.values(newWalletsSpecs);
      expectObjectArrayMatch(values, [
        { name: 'Translated<hdWalletDefaultName, "A">' },
        { name: 'Translated<hdWalletDefaultName, "B">' }
      ]);
      expectRecentTimestampInMs(values[0].createdAt);
      expectRecentTimestampInMs(values[1].createdAt);
      const [, secondHdWalletId] = Object.keys(newWalletsSpecs);
      expectObjectArrayMatch(accounts, [
        accountsBeforeReplacement[0],
        accountsBeforeReplacement[3],
        {
          type: TempleAccountType.HD,
          tezosAddress: hdWallets[1].accounts[0].tezos.address,
          evmAddress: hdWallets[1].accounts[0].evm.address,
          walletId: secondHdWalletId,
          name: defaultCustomAccountName
        }
      ]);
    });
  });

  describe('editGroupName', () => {
    it('should throw an error if the specified group does not exist', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      await expect(() => vault.editGroupName('invalidnanoid', 'newName')).rejects.toThrow('Group not found');
    });

    it('should throw an error if a group with the same name exists', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const { newWalletsSpecs } = await vault.createOrImportWallet();
      const [firstWalletId, secondWalletId] = Object.keys(newWalletsSpecs);
      await expect(() => vault.editGroupName(secondWalletId, newWalletsSpecs[firstWalletId].name)).rejects.toThrow(
        'Group with this name already exists'
      );
    });

    it('should edit the name of the specified group', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const { newWalletsSpecs } = await vault.createOrImportWallet();
      const [, secondWalletId] = Object.keys(newWalletsSpecs);
      const newGroupsNames = await vault.editGroupName(secondWalletId, 'newName');
      const { name, createdAt } = newGroupsNames[secondWalletId];
      expect(name).toEqual('newName');
      expectRecentTimestampInMs(createdAt);
    });
  });

  describe('reset', () => {
    it('should reset wallet if the given password is correct', async () => {
      await Vault.spawn(password, defaultMnemonic);
      await Vault.setup(password);
      await Vault.reset(password);
      expect(await getPassHash()).toBeUndefined();
      expect(await Vault.isExist()).toBe(false);
    });

    it('should throw an error if the given password is incorrect', async () => {
      await Vault.spawn(password, defaultMnemonic);
      await Vault.setup(password);
      await expect(() => Vault.reset(invalidPassword)).rejects.toThrow('Invalid password');
    });
  });

  describe('EVM signing functions', () => {
    const { accounts } = hdWallets[0];
    let vault: Vault;
    beforeEach(async () => {
      await Vault.spawn(password, defaultMnemonic);
      vault = await Vault.setup(password);
      const walletsSpecs = await vault.fetchWalletsSpecs();
      const firstGroupId = Object.keys(walletsSpecs)[0];
      await vault.createHDAccount(firstGroupId);
      await vault.importWatchOnlyAccount(TempleChainKind.EVM, accounts[2].evm.address);
    });

    describe('signEvmTypedData', () => {
      it('should throw an error if the specified account is a watch-only account', async () => {
        await expect(() => vault.signEvmTypedData(accounts[2].evm.address, typedDataV4)).rejects.toThrow(
          'Cannot sign Watch-only account'
        );
      });

      it('should throw an error if the specified account does not exist', async () => {
        await expect(() => vault.signEvmTypedData(accounts[3].evm.address, typedDataV4)).rejects.toThrow(
          'Account not found'
        );
      });

      it('should sign EVM V4 typed data', async () => {
        const v4Signatures = [
          '0x0424dc98837b579307e84ac9ece69f57e0958981ba683673efd79ecac71a9e855019e178a25e9634ffa7bf98d2facfa1dee78dfc066c1cbc444f9f7f1089ea2b1b',
          '0x7a0552524c94a92a38fa15ace5725110020b3e4bb0d66ec8f5392f1f73cfa1eb6f437c84f5df12091a908488d633d1aa44f220ca15f0daf72d6e4f16927915f61c'
        ];
        for (let i = 0; i < v4Signatures.length; i++) {
          expect(await vault.signEvmTypedData(accounts[i].evm.address, typedDataV4)).toEqual(v4Signatures[i]);
        }
      });

      it('should sign EVM V3 typed data', async () => {
        const v3Signatures = [
          '0x7420b983fbf0e10e33592d53a3eaad0c10ced57670bf9a4b82c37b4178559b2c5f4ff13cad9549eb6c710720dd9252d76000f14e7a9d76fa6c99aec9d04829b41b',
          '0xc2bf3021c2367654495f548d3c523660e59220b55b8932f82a7b750e848ce4746c5bc4acd85c943ddc2f82a7eb9d1e2440b08f384a5f46dedba184146e468fd31c'
        ];
        for (let i = 0; i < v3Signatures.length; i++) {
          expect(await vault.signEvmTypedData(accounts[i].evm.address, typedDataV3)).toEqual(v3Signatures[i]);
        }
      });

      it('should sign EVM V1 typed data', async () => {
        const v1Signatures = [
          '0xee053009ad94aea458b5e24bd8c577a68c39d45e1d0ce14bc3bb9331c524021723d5f90915f1910b98ac33000185a644d3f15c0c810d63aab269f74324b5c77a1b',
          '0x97bdd50520a3fe1166f91591cb5aee814650b9a4b6a4dde73cbc31cc8dc0f5e73b7c4550538bddd79f4dac309a295d7df02489595790a05c0e432e2c131c99bf1b'
        ];
        for (let i = 0; i < v1Signatures.length; i++) {
          expect(await vault.signEvmTypedData(accounts[i].evm.address, typedDataV1)).toEqual(v1Signatures[i]);
        }
      });
    });

    describe('signEvmMessage', () => {
      it('should throw an error if the specified account is a watch-only account', async () => {
        await expect(() => vault.signEvmTypedData(accounts[2].evm.address, typedDataV4)).rejects.toThrow(
          'Cannot sign Watch-only account'
        );
      });

      it('should throw an error if the specified account does not exist', async () => {
        await expect(() => vault.signEvmTypedData(accounts[3].evm.address, typedDataV4)).rejects.toThrow(
          'Account not found'
        );
      });

      it('should sign a personal_sign message', async () => {
        const message = 'Example `personal_sign` message';
        const signatures = [
          '0xa05ae8c6df3619be48d9e1aa0ecea58988be4f06559304607ff2c5a1e9f2a7bf3186407236ee7d8e0258bd80aefed6c2930088b16cd4a27113737d07442c9dff1b',
          '0xeff65a3fdfa5b546476cb3d9c0192993c4892f0d9475acac22d10407b70009f5241e575c1b1a8da0adedf609c01c66d3db234a24e90ae1b8117037b6077205ac1c'
        ];

        for (let i = 0; i < signatures.length; i++) {
          expect(await vault.signEvmMessage(accounts[i].evm.address, message)).toEqual(signatures[i]);
        }
      });
    });
  });
});
