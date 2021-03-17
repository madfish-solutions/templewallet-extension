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
    const { publicKeyHash } = accounts[0]
    const newAccounts = await vault.editAccountName(publicKeyHash, newName)
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
    const settings = await vault.updateSettings(newSettings)
    expect(settings?.lambdaContracts?.contract1!).toBe("value1")
  });

  it("Sign tz1 64 bytes test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts()
    const { publicKeyHash } = accounts[0]
    const signer = await vault.sign(publicKeyHash, "edskS3DtVSbWbPD1yviMGebjYwWJtruMjDcfAZsH9uba22EzKeYhmQkkraFosFETmEMfFNVcDYQ5QbFerj9ozDKroXZ6mb5oxV")
    expect(signer.sig).toBe("sigo2qRs669qQJnde7ZmdA2EnrS3FVEF3rS13pP1ZC9efizaBfStacNkKSQgoRZAWTEWMHYJ3UmdqqdqKKdLpTqf5D9x14yg")
  });

  it("Sign tz1 32 bytes test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts()
    const { publicKeyHash } = accounts[0]
    const signer = await vault.sign(publicKeyHash, "edsk4TjJWEszkHKono7XMnepVqwi37FrpbVt1KCsifJeAGimxheShG")
    expect(signer.sig).toBe("sigUYks4nvN3U6CdAXpzAsywHJB3vhBj8VLNsJ3dzT8rkpRQvX18uyiUAwA6T6yue9eK759zxvvEEntWyRukZa8ZM1uZv5NW")
  });

  it("Sign tz2 test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts()
    const { publicKeyHash } = accounts[0]
    const signer = await vault.sign(publicKeyHash, "spsk2rBDDeUqakQ42nBHDGQTtP3GErb6AahHPwF9bhca3Q5KA5HESE")
    expect(signer.sig).toBe("sigXqAu36vGDx6fmS9LW8wGSbzAcF2YjW1efYyYfQfNTk8H47HmnvLJtgwgMj5J9fdwirREqJv4NX4JiqcDC2skmBfKx1hCK")
  });

  it("Sign tz2 with bytes producing public key that needs padding test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts()
    const { publicKeyHash } = accounts[0]
    const signer = await vault.sign(publicKeyHash, "spsk33kCcKpgrvXRQJB2GVGxAMxrSEmwKXLh2KR4ztLcbaCnQq3FFs")
    expect(signer.sig).toBe("sigVVtP3inCYQYZB1Surjv7wFPukFA62pCtaow3kaYoJQGMMd2fz7P3v7dYAp2eN9FMQb6m6iASUhGfDmuSpQuFshoMEkfpA")
  });

  it("Sign tz3 test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts()
    const { publicKeyHash } = accounts[0]
    const signer = await vault.sign(publicKeyHash, "p2sk2obfVMEuPUnadAConLWk7Tf4Dt3n4svSgJwrgpamRqJXvaYcg1")
    expect(signer.sig).toBe("sigiqbbZKEuWSB18AHBZw6jYYLfQ7tkRgPynKki7btdnJb844dm4hDgyW8FG2gS8mF41Dqq1wkrQupBuaDQbiTs6G674KWu8")
  });

  it("Sign tz3 encrypted test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts()
    const { publicKeyHash } = accounts[0]
    const signer = await vault.sign(publicKeyHash, "p2esk2TFqgNcoT4u99ut5doGTUFNwo9x4nNvkpM6YMLqXrt4SbFdQnqLM3hoAXLMB2uZYazj6LZGvcoYzk16H6Et", "test1234")
    expect(signer.sig).toBe("sigvKqycuSGRBh8vX97MR6Ncu8DqeF36PFUhQo3uPZaGv4MFsPbDTYAzWuUCQCUzttB6f9CZzgddJ5GoQfEWRVbQxE91xwkZ")
  });


  it("Sign tz3 encrypted with bytes producing signature that needs padding test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts()
    const { publicKeyHash } = accounts[0]
    const signer = await vault.sign(publicKeyHash, "p2sk2ke47zhFz3znRZj39TW5KKS9VgfU1Hax7KeErgnShNe9oQFQUP")
    expect(signer.sig).toBe("sigZhdgSpmXkRqQ7kbbSPFAn6D2M88VPwa6ijzbjVV8sikMiGhHsGoXbTRhwv7zrvejDq37oSt4BkUm8Bc5TPgkyMPgSM54T")
  });


  it("importAccount test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.importAccount("edskS3DtVSbWbPD1yviMGebjYwWJtruMjDcfAZsH9uba22EzKeYhmQkkraFosFETmEMfFNVcDYQ5QbFerj9ozDKroXZ6mb5oxV")
    expect(accounts[1].type).toBe(TempleAccountType.Imported)
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
    )
    expect(accounts[1].type).toBe(TempleAccountType.Imported)
  });

  it("importManagedKTAccount test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts()
    const { publicKeyHash } = accounts[0]
    const newAccounts = await vault.importManagedKTAccount("KT19txYWjVo4yLvcGnnyiGc35CuX12Pc4krn", "NetXdQprcVkpaWU", publicKeyHash)
    expect(newAccounts[1].type).toBe(TempleAccountType.ManagedKT)
  });

  it("importWatchOnlyAccount test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.importWatchOnlyAccount("p2pk66tTYL5EvahKAXncbtbRPBkAnxo3CszzUho5wPCgWauBMyvybuB")
    expect(accounts[1].type).toBe(TempleAccountType.WatchOnly)
  })

  it("removeAccount test", async () => {
    await Vault.spawn(password, mnemonic);
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts()
    try {
      await Vault.removeAccount(accounts[0].publicKeyHash, password)
    } catch (e) {
      expect(e.message).toEqual("Failed to remove account")
    }
    const accountsWithWatchOnly = await vault.importWatchOnlyAccount("p2pk66tTYL5EvahKAXncbtbRPBkAnxo3CszzUho5wPCgWauBMyvybuB")
    expect(accountsWithWatchOnly[1].type).toBe(TempleAccountType.WatchOnly)
    const afterRemoveAccounts = await Vault.removeAccount(accountsWithWatchOnly[1].publicKeyHash, password)
    expect(afterRemoveAccounts.length).toBe(1)
  });
});
