import { AddAssetPage } from 'e2e/src/page-objects/pages/add-asset.page';
import { AddressBookPage } from 'e2e/src/page-objects/pages/address-book.page';
import { CollectiblePage } from 'e2e/src/page-objects/pages/collectible.page';
import { CollectiblesTabPage } from 'e2e/src/page-objects/pages/CollectiblesTab.page';
import { ConfirmationModalPage } from 'e2e/src/page-objects/pages/confirmation-modal.page';
import { NetworksDropDown } from 'e2e/src/page-objects/pages/drop-down-lists/networks.drop-down';
// eslint-disable-next-line import/namespace
import { GeneralSettingsPage } from 'e2e/src/page-objects/pages/general-settings.page';
import { ManageAssetsCollectiblesPage } from 'e2e/src/page-objects/pages/manage-assets-collectibles.page';
import { ManageAssetsTokensPage } from 'e2e/src/page-objects/pages/manage-assets-tokens.page';
import { NetworksPage } from 'e2e/src/page-objects/pages/networks.page';
import { NewsletterModalPage } from 'e2e/src/page-objects/pages/newsletter-modal.page';
import { NotificationContentPage } from 'e2e/src/page-objects/pages/notification-content.page';
import { NotificationsListPage } from 'e2e/src/page-objects/pages/notifications-list.page';
import { OnRumModalPage } from 'e2e/src/page-objects/pages/on-rum-modal.page';
import {
  OnboardingCongratsPage,
  OnboardingFirstStepPage,
  OnboardingFourthStepPage,
  OnboardingSecondStepPage,
  OnboardingThirdStepPage
} from 'e2e/src/page-objects/pages/onboarding.page';
import { RemoveAccountPage } from 'e2e/src/page-objects/pages/remove-account.page';
import { SwapPage } from 'e2e/src/page-objects/pages/swap.page';
import { TokenPage } from 'e2e/src/page-objects/pages/token.page';

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
  NetworksDropDown: new NetworksDropDown(),
  OnRumpModal: new OnRumModalPage(),
  NewsletterModal: new NewsletterModalPage(),
  Swap: new SwapPage(),
  RemoveAccount: new RemoveAccountPage(),
  AddressBook: new AddressBookPage(),
  ConfirmationModal: new ConfirmationModalPage(),
  Networks: new NetworksPage(),
  ManageAssetsCollectibles: new ManageAssetsCollectiblesPage(),
  ManageAssetsTokens: new ManageAssetsTokensPage(),
  AddAsset: new AddAssetPage(),
  Token: new TokenPage(),
  CollectiblePage: new CollectiblePage(),
  CollectiblesTabPage: new CollectiblesTabPage(),
  OnboardingFirstStep: new OnboardingFirstStepPage(),
  OnboardingSecondStep: new OnboardingSecondStepPage(),
  OnboardingThirdStep: new OnboardingThirdStepPage(),
  OnboardingFourthStep: new OnboardingFourthStepPage(),
  OnboardingCongrats: new OnboardingCongratsPage(),
  NotificationsList: new NotificationsListPage(),
  NotificationContent: new NotificationContentPage(),
  GeneralSettings: new GeneralSettingsPage()
};
