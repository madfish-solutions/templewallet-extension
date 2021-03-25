import { browser } from "webextension-polyfill-ts";

import { TempleAccountType, TempleSettings } from "../types";
import { Vault } from "./vault";

const password = "Test123!";
const mnemonic =
  "street seminar popular skill actress route treat coral ready bar program affair";
const accountName = "Temple";

describe("Vault tests", () => {
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
    expect(await Vault.isExist()).toBeFalsy();
    await Vault.spawn(password, mnemonic);
    expect(await Vault.isExist()).toBeTruthy();
  });

  it("setup test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    expect(vault).toBeDefined();
  });

  it("spawn test", async () => {
    await Vault.spawn(password, mnemonic);
    expect(Vault.isExist()).toBeTruthy();
  });

  it("revealMnemonic test", async () => {
    await Vault.spawn(password, mnemonic);
    expect(await Vault.revealMnemonic(password)).toBe(mnemonic);
  });

  it("revealPrivateKey test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.createHDAccount(accountName);
    const privateKey = await Vault.revealPrivateKey(
      accounts[0].publicKeyHash,
      password
    );
    expect(typeof privateKey).toBe("string");
  });

  it("revealPublicKey test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.createHDAccount(accountName);
    const key = await vault.revealPublicKey(accounts[0].publicKeyHash);
    expect(typeof key).toBe("string");
  });

  it("fetchAccounts test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts();
    expect(accounts[0].type).toBe(TempleAccountType.HD);
  });

  it("createHDAccount test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.createHDAccount(accountName);
    expect(accounts.length).toBe(2);
  });

  it("createHDAccount when already exist test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);

    let accounts = await vault.importAccount(
      "edskRqhkd2kyavm8evNWpKRcLiRC4f155KARsi9r4u7bqiFH6hhDdtbk3qY9yJPTDavEJUD81idM8dCLyrz6Gg5hFJ8J6iqoCZ"
    );
    accounts = await vault.createHDAccount(accountName);
    expect(accounts.length).toBe(3);
    expect(accounts[2].publicKeyHash).toBe(
      "tz1VhWfNN1qUY5rNBUMiwmnTUzpTS31s1fZD"
    );
  });

  it("editAccountName test", async () => {
    const newName = "newName";
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts();
    const { publicKeyHash } = accounts[0];
    const newAccounts = await vault.editAccountName(publicKeyHash, newName);
    const { name } = newAccounts[0];
    expect(name).toBe(newName);
  });

  it("updateSettings test", async () => {
    const newSettings: Partial<TempleSettings> = {
      lambdaContracts: {
        contract1: "value1",
      },
    };
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const settings = await vault.updateSettings(newSettings);
    expect(settings?.lambdaContracts?.contract1!).toBe("value1");
  });

  it("sign tz1 64 bytes test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.importAccount(
      "edskS3DtVSbWbPD1yviMGebjYwWJtruMjDcfAZsH9uba22EzKeYhmQkkraFosFETmEMfFNVcDYQ5QbFerj9ozDKroXZ6mb5oxV"
    );
    const { publicKeyHash } = accounts[1];
    const result = await vault.sign(publicKeyHash, "1234");
    expect(result.sig).toBe(
      "sigw9kKaD9FUiGhr2pSKdEFm9X8fTPVXbemqWUU3CYLsJQ9MhJhbyY6yK5MrvV143FgMyQF5qNSeHVV1EAA4TNjor3ThGDRW"
    );
  });

  it("sign tz1 32 bytes test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.importAccount(
      "edsk4TjJWEszkHKono7XMnepVqwi37FrpbVt1KCsifJeAGimxheShG"
    );
    const { publicKeyHash } = accounts[1];
    const result = await vault.sign(publicKeyHash, "1234");
    expect(result.sig).toBe(
      "sigpys8t3w9EGaLRsYsoGCNrpUdBQXpjufpaEA8ti5xSP1yYdxFBChDrDnKrcDFmLtvMBKYzWgk3dSgbej76gPW6HvEVnGNy"
    );
  });

  it("sign tz2 test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.importAccount(
      "spsk2rBDDeUqakQ42nBHDGQTtP3GErb6AahHPwF9bhca3Q5KA5HESE"
    );
    const { publicKeyHash } = accounts[1];
    const result = await vault.sign(publicKeyHash, "1234");
    expect(result.sig).toBe(
      "sigYv2Stb2x45tnDgWCGbzCafti8psCnEUi4eNjQ1EqNssiTcKtP2F4dtqnZCCS5T3X61rGhRSCCPxkZhLh8zkpcDE5UMMCD"
    );
  });

  it("sign tz2 with bytes producing public key that needs padding test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.importAccount(
      "spsk33kCcKpgrvXRQJB2GVGxAMxrSEmwKXLh2KR4ztLcbaCnQq3FFs"
    );
    const { publicKeyHash } = accounts[1];
    const result = await vault.sign(publicKeyHash, "1234");
    expect(result.sig).toBe(
      "sigsWFKzoiZtikehVJZrsbMMWFSZbjW7uDriPTXpUDyqSVMprLrroG9G8dX62M91aQNpZTwZ8UWMMTniFSyBBksggcU4Nqd2"
    );
  });

  it("sign tz3 test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.importAccount(
      "p2sk2obfVMEuPUnadAConLWk7Tf4Dt3n4svSgJwrgpamRqJXvaYcg1"
    );
    const { publicKeyHash } = accounts[1];
    const result = await vault.sign(publicKeyHash, "1234");
    expect(result.sig).toBe(
      "sigiZSgc352U4NzFXWcm7F8XmzXrqedsNzL3ifnJEU5FMjzZsjGYSswJBFAdLyFzxpGY5d1D8iMx7UgJp2WCWWDTNTQS9Bf5"
    );
  });

  it("sign tz3 encrypted test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.importAccount(
      "p2esk2TFqgNcoT4u99ut5doGTUFNwo9x4nNvkpM6YMLqXrt4SbFdQnqLM3hoAXLMB2uZYazj6LZGvcoYzk16H6Et",
      "test1234"
    );
    const { publicKeyHash } = accounts[1];
    const result = await vault.sign(publicKeyHash, "1234", "test1234");
    expect(result.sig).toBe(
      "sigq3x4AvBDqF8koSQhVYW5Gg6VqYvYR5KR6QTK936Kvmkz9kbWt4kpdTeJeZHqXjYAVb14oKfUFSfBovYZFzepjpTJMUfbg"
    );
  });

  it("sign tz3 encrypted with bytes producing signature that needs padding test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    let accounts = await vault.importAccount(
      "p2sk2ke47zhFz3znRZj39TW5KKS9VgfU1Hax7KeErgnShNe9oQFQUP"
    );
    const { publicKeyHash } = accounts[1];
    const result = await vault.sign(publicKeyHash, "1234");
    expect(result.sig).toBe(
      "sighPNR73p7peCRZuJPpqhRyQrZcyNcGGdqy4v95SQFJKmQXHoxPvxZE6mkA85GVaQDCR6hw6fpVBRRzpzrzyN1CJY5K8Mnn"
    );
    const publicKeyHashTwo = accounts[1].publicKeyHash;
    const result2 = await vault.sign(
      publicKeyHashTwo,
      "03051d7ba791fbe8ccfb6f83dd9c760db5642358909eede2a915a26275e6880b9a6c02a2dea17733a2ef2685e5511bd3f160fd510fea7db50edd8122997800c0843d016910882a9436c31ce1d51570e21ae277bb8d91b800006c02a2dea17733a2ef2685e5511bd3f160fd510fea7df416de812294cd010000016910882a9436c31ce1d51570e21ae277bb8d91b800ff020000004602000000410320053d036d0743035d0100000024747a31655935417161316b5844466f6965624c3238656d7958466f6e65416f5667317a68031e0743036a0032034f034d031b6c02a2dea17733a2ef2685e5511bd3f160fd510fea7dd016df8122a6ca010000016910882a9436c31ce1d51570e21ae277bb8d91b800ff020000003e02000000390320053d036d0743035d0100000024747a3161575850323337424c774e484a6343443462334475744365766871713254315a390346034e031b6c02a2dea17733a2ef2685e5511bd3f160fd510fea7dc916e08122dec9010000016910882a9436c31ce1d51570e21ae277bb8d91b800ff0200000013020000000e0320053d036d053e035d034e031b"
    );
    expect(result2.prefixSig).toBe(
      "p2sigMMsHbzzKh6Eg3cDxfLURiUpTMkyjyPWd7RFtBUH7ZyGBzBqMZH9xZc16akQWZNKkCMHnf1vYjjckPEfru456ikHaFWXFD"
    );
  });

  it("importAccount test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.importAccount(
      "edskS3DtVSbWbPD1yviMGebjYwWJtruMjDcfAZsH9uba22EzKeYhmQkkraFosFETmEMfFNVcDYQ5QbFerj9ozDKroXZ6mb5oxV"
    );
    expect(accounts[1].type).toBe(TempleAccountType.Imported);
  });

  it("importFundraiserAccount test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.importFundraiserAccount(
      "rtphpwty.yohjelcp@tezos.example.org",
      "HMYlTEu0EF",
      [
        "zone",
        "cheese",
        "venture",
        "sad",
        "marriage",
        "attitude",
        "borrow",
        "limit",
        "country",
        "agent",
        "away",
        "raven",
        "nerve",
        "laptop",
        "oven",
      ].join(" ")
    );
    expect(accounts[1].type).toBe(TempleAccountType.Imported);
    expect(accounts[1].publicKeyHash).toBe(
      "tz1ZfrERcALBwmAqwonRXYVQBDT9BjNjBHJu"
    );
  });

  it("importManagedKTAccount test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts();
    const { publicKeyHash } = accounts[0];
    const newAccounts = await vault.importManagedKTAccount(
      "KT19txYWjVo4yLvcGnnyiGc35CuX12Pc4krn",
      "NetXdQprcVkpaWU",
      publicKeyHash
    );
    expect(newAccounts[1].type).toBe(TempleAccountType.ManagedKT);
  });

  it("importWatchOnlyAccount test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.importWatchOnlyAccount(
      "KT19txYWjVo4yLvcGnnyiGc35CuX12Pc4krn"
    );
    expect(accounts[1].type).toBe(TempleAccountType.WatchOnly);
  });

  it("removeAccount test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts();
    try {
      await Vault.removeAccount(accounts[0].publicKeyHash, password);
    } catch (e) {
      expect(e.message).toEqual("Failed to remove account");
    }
    const accountsWithWatchOnly = await vault.importWatchOnlyAccount(
      "KT19txYWjVo4yLvcGnnyiGc35CuX12Pc4krn"
    );
    expect(accountsWithWatchOnly[1].type).toBe(TempleAccountType.WatchOnly);
    const afterRemoveAccounts = await Vault.removeAccount(
      accountsWithWatchOnly[1].publicKeyHash,
      password
    );
    expect(afterRemoveAccounts.length).toBe(1);
  });
});
