import { generateKey } from "../passworder";
import { Vault } from "./vault";
import { inited } from "./store";

let passKey: CryptoKey
let vault: Vault
const password = "Test123!"
const mnemonic = "champion lumber erupt shy hat smooth sound great spin cliff dolphin stuff"
const accountName = "Temple"


describe("Safe Storage tests", () => {

  beforeAll(async () => {
    passKey = await generateKey("passKey")
    vault = new Vault(passKey)
    inited(true);
  })

  it("init test", async () => {
    await Vault.spawn(password, mnemonic);
    const accounts = await vault.createHDAccount(accountName)
    console.log(accounts);

  });

  it("isExist test", async () => {
  });

  it("setup test", async () => {
  });

  it("spawn test", async () => {
  });

  it("runMigrations test", async () => {

  });

  it("revealMnemonic test", async () => {

  });

  it("revealPrivateKey test", async () => {

  });

  it("removeAccount test", async () => {

  });

  it("revealPublicKey test", async () => {

  });

  it("fetchAccounts test", async () => {

  });

  it("createHDAccount test", async () => {

  });

  it("importAccount test", async () => {

  });

  it("importMnemonicAccount test", async () => {

  });

  it("importFundraiserAccount test", async () => {

  });

  it("importManagedKTAccount test", async () => {

  });

  it("importWatchOnlyAccount test", async () => {

  });

  it("editAccountName test", async () => {

  });

  it("updateSettings test", async () => {

  });

  it("sign test", async () => {

  });

  it("importWatchOnlyAccount test", async () => {

  });

});
