import browser from 'webextension-polyfill';

import { AT_LEAST_ONE_HD_ACCOUNT_ERR_MSG, ACCOUNT_NAME_COLLISION_ERR_MSG } from 'lib/constants';
import { getAccountAddressForTezos } from 'temple/accounts';
import { TempleChainName } from 'temple/types';

import { TempleAccountType, TempleSettings } from '../../types';

import { setGeneratedMnemonicOnce } from './bip39.mock';

import { Vault } from './index';

const password = 'Test123!';

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

const mockBip39GeneratedMnemonic = 'avoid absorb sea someone blade right suspect fitness great flush accident laugh';

const defaultMnemonic = hdWallets[0].mnemonic;

const defaultCustomAccountName = 'Temple';
const mockManagedContractAddress = 'KT19txYWjVo4yLvcGnnyiGc35CuX12Pc4krn';

describe('Vault tests', () => {
  jest.setTimeout(15000);

  beforeEach(async () => {
    await browser.storage.local.clear();
  });

  const expectObjectArrayMatch = <T extends object>(actual: T[], expected: Partial<T>[]) => {
    expect(actual).toHaveLength(expected.length);
    actual.forEach((item, i) => {
      expect(item).toMatchObject(expected[i]);
    });
  };

  it('init test', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const groups = await vault.fetchHdGroups();
    expectObjectArrayMatch(groups, [{ name: 'Translated<hdGroupDefaultName, "A">' }]);
    const accounts = await vault.createHDAccount(groups[0].id, defaultCustomAccountName);
    expectObjectArrayMatch(accounts, [
      {
        type: TempleAccountType.HD,
        name: 'Translated<defaultAccountName, "1">',
        hdIndex: 0,
        tezosAddress: hdWallets[0].accounts[0].tezos.address,
        evmAddress: hdWallets[0].accounts[0].evm.address,
        groupId: groups[0].id
      },
      {
        type: TempleAccountType.HD,
        name: defaultCustomAccountName,
        hdIndex: 1,
        tezosAddress: hdWallets[0].accounts[1].tezos.address,
        evmAddress: hdWallets[0].accounts[1].evm.address,
        groupId: groups[0].id
      }
    ]);
    expect(accounts[0].id).not.toBe(accounts[1].id);
  });

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
    const groups = await vault.fetchHdGroups();
    expect(await Vault.revealMnemonic(groups[0].id, password)).toBe(defaultMnemonic);
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
      const [{ id: groupId }] = await vault.fetchHdGroups();
      await vault.createHDAccount(groupId, defaultCustomAccountName);
      await expect(vault.createHDAccount(groupId, defaultCustomAccountName)).rejects.toThrow(
        ACCOUNT_NAME_COLLISION_ERR_MSG
      );
    });

    it('should create an account if another one with the same name exists in another group', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      await vault.createOrImportWallet(hdWallets[1].mnemonic);
      const [{ id: firstGroupId }, { id: secondGroupId }] = await vault.fetchHdGroups();
      await vault.createHDAccount(firstGroupId, defaultCustomAccountName);
      await vault.createHDAccount(secondGroupId, defaultCustomAccountName);
      const accounts = await vault.fetchAccounts();
      expectObjectArrayMatch(accounts, [
        { type: TempleAccountType.HD, tezosAddress: hdWallets[0].accounts[0].tezos.address, groupId: firstGroupId },
        { type: TempleAccountType.HD, tezosAddress: hdWallets[1].accounts[0].tezos.address, groupId: secondGroupId },
        {
          type: TempleAccountType.HD,
          tezosAddress: hdWallets[0].accounts[1].tezos.address,
          groupId: firstGroupId,
          name: defaultCustomAccountName
        },
        {
          type: TempleAccountType.HD,
          tezosAddress: hdWallets[1].accounts[1].tezos.address,
          groupId: secondGroupId,
          name: defaultCustomAccountName
        }
      ]);
    });

    it('should create the 4th HD account given the 1st and the 3rd one', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const [{ id: firstGroupId }] = await vault.fetchHdGroups();
      await vault.createHDAccount(firstGroupId);
      const accountsBeforeDeletion = await vault.createHDAccount(firstGroupId);
      await Vault.removeAccount(accountsBeforeDeletion[1].id, password);
      const accounts = await vault.createHDAccount(firstGroupId);
      expectObjectArrayMatch(accounts, [
        {
          type: TempleAccountType.HD,
          tezosAddress: hdWallets[0].accounts[0].tezos.address,
          evmAddress: hdWallets[0].accounts[0].evm.address,
          groupId: firstGroupId,
          id: accountsBeforeDeletion[0].id,
          name: 'Translated<defaultAccountName, "1">'
        },
        {
          type: TempleAccountType.HD,
          tezosAddress: hdWallets[0].accounts[2].tezos.address,
          evmAddress: hdWallets[0].accounts[2].evm.address,
          groupId: firstGroupId,
          id: accountsBeforeDeletion[2].id,
          name: 'Translated<defaultAccountName, "3">'
        },
        {
          type: TempleAccountType.HD,
          tezosAddress: hdWallets[0].accounts[3].tezos.address,
          evmAddress: hdWallets[0].accounts[3].evm.address,
          groupId: firstGroupId,
          name: 'Translated<defaultAccountName, "4">'
        }
      ]);
    }, 20000);

    it('should create an account with the specified name', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const [{ id: firstGroupId }] = await vault.fetchHdGroups();
      const accounts = await vault.createHDAccount(firstGroupId, defaultCustomAccountName);
      expect(accounts[1]).toMatchObject({
        type: TempleAccountType.HD,
        name: defaultCustomAccountName
      });
    });

    it('should create an account with the specified HD index', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const [{ id: firstGroupId }] = await vault.fetchHdGroups();
      const accounts = await vault.createHDAccount(firstGroupId, defaultCustomAccountName, 3);
      expect(accounts[1]).toMatchObject({
        type: TempleAccountType.HD,
        hdIndex: 3,
        tezosAddress: hdWallets[0].accounts[3].tezos.address,
        evmAddress: hdWallets[0].accounts[3].evm.address
      });
    });

    it('should replace non-HD accounts with the same addresses', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const [{ id: firstGroupId }] = await vault.fetchHdGroups();
      await vault.importAccount(TempleChainName.Tezos, hdWallets[0].accounts[1].tezos.privateKey);
      await vault.importWatchOnlyAccount(TempleChainName.EVM, hdWallets[0].accounts[1].evm.address);
      await vault.importAccount(TempleChainName.Tezos, hdWallets[0].accounts[2].tezos.privateKey);
      const accounts = await vault.createHDAccount(firstGroupId);
      expectObjectArrayMatch(accounts, [
        {
          type: TempleAccountType.HD,
          tezosAddress: hdWallets[0].accounts[0].tezos.address,
          evmAddress: hdWallets[0].accounts[0].evm.address,
          groupId: firstGroupId
        },
        {
          type: TempleAccountType.Imported,
          chain: TempleChainName.Tezos,
          address: hdWallets[0].accounts[2].tezos.address
        },
        {
          type: TempleAccountType.HD,
          tezosAddress: hdWallets[0].accounts[1].tezos.address,
          evmAddress: hdWallets[0].accounts[1].evm.address,
          groupId: firstGroupId
        }
      ]);
    });
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
      const [{ id: firstGroupId }] = await vault.fetchHdGroups();
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
    expect(settings?.contacts).toBe(contactsMock);
  });

  describe('signing payload', () => {
    describe('for tz1 accounts', () => {
      it('should sign an arbitrary payload with 32 bytes key', async () => {
        await Vault.spawn(password, defaultMnemonic);
        const vault = await Vault.setup(password);
        const accounts = await vault.importAccount(
          TempleChainName.Tezos,
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
          TempleChainName.Tezos,
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
          TempleChainName.Tezos,
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
          TempleChainName.Tezos,
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
          TempleChainName.Tezos,
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
          TempleChainName.Tezos,
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
          TempleChainName.Tezos,
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
  });

  it('should import an account by Tezos private key', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.importAccount(
      TempleChainName.Tezos,
      'edskS3DtVSbWbPD1yviMGebjYwWJtruMjDcfAZsH9uba22EzKeYhmQkkraFosFETmEMfFNVcDYQ5QbFerj9ozDKroXZ6mb5oxV'
    );
    expect(accounts[1]).toMatchObject({
      name: 'Translated<defaultAccountName, "1">',
      type: TempleAccountType.Imported,
      chain: TempleChainName.Tezos,
      address: 'tz1RvhdZ5pcjD19vCCK9PgZpnmErTba3dsBs'
    });
  });

  it('should import an account by EVM private key', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.importAccount(TempleChainName.EVM, hdWallets[0].accounts[1].evm.privateKey);
    expect(accounts[1]).toMatchObject({
      type: TempleAccountType.Imported,
      chain: TempleChainName.EVM,
      address: hdWallets[0].accounts[1].evm.address
    });
  });

  it('should import a fundraiser account', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const [, fundraiserAccount] = await vault.importFundraiserAccount(
      'rtphpwty.yohjelcp@tezos.example.org',
      'HMYlTEu0EF',
      [
        'zone',
        'cheese',
        'venture',
        'sad',
        'marriage',
        'attitude',
        'borrow',
        'limit',
        'country',
        'agent',
        'away',
        'raven',
        'nerve',
        'laptop',
        'oven'
      ].join(' ')
    );
    expect(fundraiserAccount).toMatchObject({
      type: TempleAccountType.Imported,
      chain: TempleChainName.Tezos,
      address: 'tz1ZfrERcALBwmAqwonRXYVQBDT9BjNjBHJu'
    });
  });

  it('should import a managed KT account', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts();
    const owner = getAccountAddressForTezos(accounts[0])!;
    const [, newAccount] = await vault.importManagedKTAccount(mockManagedContractAddress, 'NetXdQprcVkpaWU', owner);
    expect(newAccount).toMatchObject({
      type: TempleAccountType.ManagedKT,
      name: 'Translated<defaultManagedKTAccountName, "1">',
      tezosAddress: mockManagedContractAddress,
      chainId: 'NetXdQprcVkpaWU',
      owner
    });
  });

  it('should import a watch-only account', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const [, newAccount] = await vault.importWatchOnlyAccount(TempleChainName.Tezos, mockManagedContractAddress);
    expect(newAccount).toMatchObject({
      type: TempleAccountType.WatchOnly,
      name: 'Translated<defaultWatchOnlyAccountName, "1">',
      chain: TempleChainName.Tezos,
      address: mockManagedContractAddress
    });
  });

  it('should not import an account with the same address', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    await vault.importWatchOnlyAccount(TempleChainName.Tezos, mockManagedContractAddress);
    await expect(() => vault.importWatchOnlyAccount(TempleChainName.Tezos, mockManagedContractAddress)).rejects.toThrow(
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
      const [hdAccount] = await vault.importAccount(TempleChainName.Tezos, hdWallets[0].accounts[1].tezos.privateKey);
      await expect(() => Vault.removeAccount(hdAccount.id, password)).rejects.toThrow(AT_LEAST_ONE_HD_ACCOUNT_ERR_MSG);
    });

    it('should remove an HD account and its HD group if it becomes empty', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const { newHdGroups: hdGroupsBeforeDeletion } = await vault.createOrImportWallet();
      const accountsBeforeDeletion = await vault.createHDAccount(hdGroupsBeforeDeletion[1].id);
      const { newAccounts: accountsV2, newHdGroups: hdGroupsV2 } = await Vault.removeAccount(
        accountsBeforeDeletion[1].id,
        password
      );
      expect(hdGroupsV2).toEqual(hdGroupsBeforeDeletion);
      expect(accountsV2).toEqual([accountsBeforeDeletion[0], accountsBeforeDeletion[2]]);
      const { newAccounts: accountsV3, newHdGroups: hdGroupsV3 } = await Vault.removeAccount(
        accountsBeforeDeletion[2].id,
        password
      );
      expect(hdGroupsV3).toEqual([hdGroupsBeforeDeletion[0]]);
      expect(accountsV3).toEqual([accountsBeforeDeletion[0]]);
    });

    it('should remove an imported account', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const accountsBeforeDeletion = await vault.importAccount(
        TempleChainName.Tezos,
        hdWallets[0].accounts[1].tezos.privateKey
      );
      const { newAccounts: accountsAfterDeletion } = await Vault.removeAccount(accountsBeforeDeletion[1].id, password);
      expect(accountsAfterDeletion).toEqual([accountsBeforeDeletion[0]]);
    });
  });

  describe('removeHDGroup', () => {
    it('should throw an error if the specified group does not exist', async () => {
      await Vault.spawn(password, defaultMnemonic);
      await Vault.setup(password);
      await expect(() => Vault.removeHdGroup('invalidnanoid', password)).rejects.toThrow();
    });

    it('should throw an error on an attempt to remove the only HD group', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const [hdGroup] = await vault.fetchHdGroups();
      await expect(() => Vault.removeHdGroup(hdGroup.id, password)).rejects.toThrow(AT_LEAST_ONE_HD_ACCOUNT_ERR_MSG);
    });

    it('should remove the specified HD group and its accounts', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const { newHdGroups: hdGroupsBeforeDeletion } = await vault.createOrImportWallet();
      const accountsBeforeDeletion = await vault.createHDAccount(hdGroupsBeforeDeletion[1].id);
      const { newAccounts: accountsV2, newHdGroups: hdGroupsV2 } = await Vault.removeHdGroup(
        hdGroupsBeforeDeletion[1].id,
        password
      );
      expect(hdGroupsV2).toEqual([hdGroupsBeforeDeletion[0]]);
      expect(accountsV2).toEqual([accountsBeforeDeletion[0]]);
    });
  });

  it('should remove accounts of the specified type, except the HD ones', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    await vault.importAccount(TempleChainName.Tezos, hdWallets[0].accounts[1].tezos.privateKey);
    await vault.importAccount(TempleChainName.EVM, hdWallets[0].accounts[1].evm.privateKey);
    await vault.importWatchOnlyAccount(TempleChainName.Tezos, hdWallets[0].accounts[2].tezos.address);
    await vault.importManagedKTAccount(
      mockManagedContractAddress,
      'NetXdQprcVkpaWU',
      hdWallets[0].accounts[0].tezos.address
    );
    const accountsBeforeDeletion = await vault.fetchAccounts();
    const accountsWithoutImported = await Vault.removeAccountsByType(TempleAccountType.Imported, password);
    expect(accountsWithoutImported).toEqual([
      accountsBeforeDeletion[0],
      accountsBeforeDeletion[3],
      accountsBeforeDeletion[4]
    ]);
    const accountsWithoutWatchOnly = await Vault.removeAccountsByType(TempleAccountType.WatchOnly, password);
    expect(accountsWithoutWatchOnly).toEqual([accountsBeforeDeletion[0], accountsBeforeDeletion[4]]);
    const accountsWithoutManagedKT = await Vault.removeAccountsByType(TempleAccountType.ManagedKT, password);
    expect(accountsWithoutManagedKT).toEqual([accountsBeforeDeletion[0]]);
  });

  it('should fetch all HD groups', async () => {
    await Vault.spawn(password, defaultMnemonic);
    const vault = await Vault.setup(password);
    const groups = await vault.fetchHdGroups();
    expectObjectArrayMatch(groups, [{ name: 'Translated<hdGroupDefaultName, "A">' }]);
  });

  describe('createOrImportWallet', () => {
    it('should throw an error on an attempt to import a wallet with the same mnemonic', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const [firstGroup] = await vault.fetchHdGroups();
      const [firstAccount] = await vault.createHDAccount(firstGroup.id);
      await Vault.removeAccount(firstAccount.id, password);
      await expect(() => vault.createOrImportWallet(defaultMnemonic)).rejects.toThrow(
        'This wallet is already imported'
      );
    });

    it('should use a mnemonic generated by "bip39" if it is not specified', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      setGeneratedMnemonicOnce(mockBip39GeneratedMnemonic);
      const { newHdGroups: hdGroups } = await vault.createOrImportWallet();
      const generatedMnemonic = await Vault.revealMnemonic(hdGroups[1].id, password);
      expect(generatedMnemonic).toBe(mockBip39GeneratedMnemonic);
    });

    it('should use the specified mnemonic', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const { newHdGroups: hdGroups } = await vault.createOrImportWallet(hdWallets[1].mnemonic);
      const importedMnemonic = await Vault.revealMnemonic(hdGroups[1].id, password);
      expect(importedMnemonic).toBe(hdWallets[1].mnemonic);
    });

    it('should replace non-HD accounts with the same addresses', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      await vault.importAccount(TempleChainName.Tezos, hdWallets[1].accounts[0].tezos.privateKey);
      await vault.importWatchOnlyAccount(TempleChainName.EVM, hdWallets[1].accounts[0].evm.address);
      const accountsBeforeReplacement = await vault.importAccount(
        TempleChainName.Tezos,
        hdWallets[0].accounts[2].tezos.privateKey
      );
      const { newHdGroups: hdGroups, newAccounts: accounts } = await vault.createOrImportWallet(hdWallets[1].mnemonic);
      expectObjectArrayMatch(hdGroups, [
        { name: 'Translated<hdGroupDefaultName, "A">' },
        { name: 'Translated<hdGroupDefaultName, "B">' }
      ]);
      expectObjectArrayMatch(accounts, [
        accountsBeforeReplacement[0],
        accountsBeforeReplacement[3],
        {
          type: TempleAccountType.HD,
          tezosAddress: hdWallets[1].accounts[0].tezos.address,
          evmAddress: hdWallets[1].accounts[0].evm.address,
          groupId: hdGroups[1].id,
          name: 'Translated<defaultAccountName, "1">'
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
      const { newHdGroups } = await vault.createOrImportWallet();
      await expect(() => vault.editGroupName(newHdGroups[1].id, newHdGroups[0].name)).rejects.toThrow(
        'Group with this name already exists'
      );
    });

    it('should edit the name of the specified group', async () => {
      await Vault.spawn(password, defaultMnemonic);
      const vault = await Vault.setup(password);
      const { newHdGroups } = await vault.createOrImportWallet();
      const newGroups = await vault.editGroupName(newHdGroups[1].id, 'newName');
      expect(newGroups[1]).toMatchObject({ name: 'newName' });
    });
  });
});
