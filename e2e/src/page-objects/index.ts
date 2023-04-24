import { NetworksDropDown } from 'e2e/src/page-objects/pages/drop-down-lists/networks.drop-down';

import { OperationStatusAlert } from './pages/alerts/operation-status.alert';
import { CreateOrRestoreAnAccountPage } from './pages/create-or-restore-an-account.page';
import { DelegateFormPage } from './pages/delegate-form.page';
import { DelegateTab } from './pages/delegate-tab.page';
import { AccountsDropdown } from './pages/drop-down-lists/accounts.drop-down';
import { HeaderPage } from './pages/header.page';
import { HomePage } from './pages/home.page';
import { ImportAccountMnemonicTab } from './pages/import-account-tabs/import-account-mnemonic-tab.page';
import { ImportAccountPrivateKeyTab } from './pages/import-account-tabs/import-account-private-key-tab.page';
import { ImportAccountTab } from './pages/import-account-tabs/import-account-tab-switcher.page';
import { ImportAccountWatchOnlyTab } from './pages/import-account-tabs/import-account-watch-only-tab.page';
import { ImportExistingWalletPage } from './pages/importing-existing-wallet.page';
// eslint-disable-next-line import/namespace
import { InternalConfirmationPage } from './pages/internal-confirmation.page';
import { NewSeedBackupPage } from './pages/new-seed-backup.page';
import { RevealSecretsPage } from './pages/reveal-secrets.page';
import { SendPage } from './pages/send.page';
import { SettingsPage } from './pages/settings.page';
import { setWalletPage } from './pages/setWalletPassword.page';
import { UnlockScreenPage } from './pages/unlock-screen.page';
import { VerifyMnemonicPage } from './pages/verify-mnemonic.page';
import { WelcomePage } from './pages/welcome.page';

export const Pages = {
  Welcome: new WelcomePage(),
  ImportExistingWallet: new ImportExistingWalletPage(),
  SetWallet: new setWalletPage(),
  Header: new HeaderPage(),
  AccountsDropdown: new AccountsDropdown(),
  Settings: new SettingsPage(),
  RevealSecrets: new RevealSecretsPage(),
  NewSeedBackup: new NewSeedBackupPage(),
  VerifyMnemonic: new VerifyMnemonicPage(),
  ImportAccountTab: new ImportAccountTab(),
  ImportAccountPrivateKey: new ImportAccountPrivateKeyTab(),
  ImportAccountMnemonic: new ImportAccountMnemonicTab(),
  ImportAccountWatchOnly: new ImportAccountWatchOnlyTab(),
  Home: new HomePage(),
  CreateOrRestoreAnAccount: new CreateOrRestoreAnAccountPage(),
  UnlockScreen: new UnlockScreenPage(),
  DelegateTab: new DelegateTab(),
  DelegateForm: new DelegateFormPage(),
  InternalConfirmation: new InternalConfirmationPage(),
  OperationStatusAlert: new OperationStatusAlert(),
  Send: new SendPage(),
  NetworksDropDown: new NetworksDropDown()
};
