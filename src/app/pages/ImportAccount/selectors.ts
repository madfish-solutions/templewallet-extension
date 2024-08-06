export enum ImportAccountSelectors {
  tabSwitcher = 'Import Account/Tabs',

  privateKeyInput = 'Import Account(Private Key)/Private Key Input',
  privateKeyImportButton = 'Import Account(Private Key)/Private Key Import Button',

  mnemonicWordInput = 'Import Account(Mnemonic)/Mnemonic Word Input',
  mnemonicDropDownButton = 'Import (Account/Wallet)/Mnemonic Drop Down Button',
  mnemonicWordsOption = 'Import (Account/Wallet)/Mnemonic Words Option',
  defaultAccountButton = 'Import Account(Mnemonic)/Default Account (the first one) Button',
  customDerivationPathButton = 'Import Account(Mnemonic)/Custom Derivation Path Button',
  customDerivationPathInput = 'Import Account(Mnemonic)/Custom Derivation Path Input',
  mnemonicPasswordInput = 'Import Account(Mnemonic)/Mnemonic Password Input',
  mnemonicImportButton = 'Import Account(Mnemonic)/Mnemonic Import Button',
  mnemonicValidationErrorText = 'Import (Account/Wallet)/Mnemonic Validation Error Text',

  watchOnlyInput = 'Import Account(Watch-Only)/Watch Only Input',
  watchOnlyImportButton = 'Import Account(Watch-Only)/Watch Only Import Button',

  ClearSeedPhraseButton = 'Import Account/Clear Seed Phrase Button',
  PasteSeedPhraseButton = 'Import Account/Paste Seed Phrase Button'
}

export enum ImportAccountFormType {
  PrivateKey = 'ImportAccountFormType.PrivateKey',
  Mnemonic = 'ImportAccountFormType.Mnemonic',
  WatchOnly = 'ImportAccountFormType.WatchOnly'
}
