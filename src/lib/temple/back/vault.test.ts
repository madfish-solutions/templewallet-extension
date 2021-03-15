import { Vault } from "./vault";
import { browser } from "webextension-polyfill-ts";
import { TempleAccountType, TempleSettings } from "../types";

const password = "Test123!";
const mnemonic =
    "champion lumber erupt shy hat smooth sound great spin cliff dolphin stuff";
const accountName = "Temple";

describe("Safe Storage tests", () => {
  beforeEach(async () => {
    await browser.storage.local.clear();
  });

  it("init test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.createHDAccount(accountName);
    expect(Array.isArray(accounts)).toBeTruthy();
  });

  it("isExist test", async () => {
    expect(await Vault.isExist()).toBeFalsy()
    await Vault.spawn(password, mnemonic);
    expect(await Vault.isExist()).toBeTruthy()
  });

  it("setup test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    expect(vault).toBeDefined()
  });

  it("spawn test", async () => {
    await Vault.spawn(password, mnemonic);
    expect(Vault.isExist()).toBeTruthy()
  });


  it("revealMnemonic test", async () => {
    await Vault.spawn(password, mnemonic);
    expect(await Vault.revealMnemonic(password)).toBe(mnemonic)
  });

  it("revealPrivateKey test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.createHDAccount(accountName);
    const privateKey = await Vault.revealPrivateKey(accounts[0].publicKeyHash, password)
    expect(typeof privateKey).toBe("string")
  });


  it("revealPublicKey test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.createHDAccount(accountName);
    const key = await vault.revealPublicKey(accounts[0].publicKeyHash)
    expect(typeof key).toBe("string")
  });

  it("fetchAccounts test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts()
    expect(accounts[0].type).toBe(TempleAccountType.HD)
  });

  it("createHDAccount test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.createHDAccount(accountName);
    expect(accounts.length).toBe(2)
  });

  it("editAccountName test", async () => {
    const newName = "newName"
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts()
    const {publicKeyHash} = accounts[0]
    await vault.editAccountName(publicKeyHash, newName)
    const newAccounts = await vault.fetchAccounts()
    const { name } = newAccounts[0]
    expect(name).toBe(newName)
  });

  it("updateSettings test", async () => {
    const newSettings: Partial<TempleSettings> = {
      lambdaContracts: {
        contract1: "value1"
      }
    }
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    await vault.updateSettings(newSettings)
    const settings = await vault.fetchSettings()
    expect(settings?.lambdaContracts?.contract1!).toBe("value1")
  });

  it("sign test", async () => {
    // TODO: need example how to test

    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts()
    const {publicKeyHash} = accounts[0]
    // const res = await vault.sign(publicKeyHash, "test")
    // expect(res).toBeDefined()
  });


  it("importAccount test", async () => {
    // TODO: need example how to test
  });

  it("importMnemonicAccount test", async () => {
    // TODO: need example how to test
  });

  it("importFundraiserAccount test", async () => {
    // TODO: need example how to test
  });

  it("importManagedKTAccount test", async () => {
    // TODO: need example how to test
  });

  it("importWatchOnlyAccount test", async () => {
    // TODO: need example how to test
  })

  it("removeAccount test", async () => {
    // TODO: need example how to test
  });

  it("runMigrations test", async () => {
    // TODO: need example how to test
  });
});
