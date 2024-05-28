import { AddAssetPage } from '../page-objects/pages/add-asset.page';
import { AddressBookPage } from '../page-objects/pages/address-book.page';
import { CollectiblePage } from '../page-objects/pages/collectible.page';
import { CollectiblesTabPage } from '../page-objects/pages/CollectiblesTab.page';
import { ConfirmationModalPage } from '../page-objects/pages/confirmation-modal.page';
// eslint-disable-next-line import/namespace
import { GeneralSettingsPage } from '../page-objects/pages/general-settings.page';
import { ManageAssetsCollectiblesPage } from '../page-objects/pages/manage-assets-collectibles.page';
import { ManageAssetsTokensPage } from '../page-objects/pages/manage-assets-tokens.page';
import { NetworksPage } from '../page-objects/pages/networks.page';
import { NewsletterModalPage } from '../page-objects/pages/newsletter-modal.page';
import { NotificationContentPage } from '../page-objects/pages/notification-content.page';
import { NotificationsListPage } from '../page-objects/pages/notifications-list.page';
import { OnRumModalPage } from '../page-objects/pages/on-rum-modal.page';
import { SwapPage } from '../page-objects/pages/swap.page';

import { OperationStatusAlert } from './pages/alerts/operation-status.alert';
import { DelegateFormPage } from './pages/delegate-form.page';
import { DelegateTab } from './pages/delegate-tab.page';
import { HomePage } from './pages/home.page';
import { ImportExistingWalletPage } from './pages/importing-existing-wallet.page';
// eslint-disable-next-line import/namespace
import { InternalConfirmationPage } from './pages/internal-confirmation.page';
import { NewSeedBackupPage } from './pages/new-seed-backup.page';
import { RevealSecretsPage } from './pages/reveal-secrets.page';
import { SendPage } from './pages/send.page';
import { SettingsPage } from './pages/settings.page';
import { setWalletPage } from './pages/setWalletPassword.page';
import { UnlockScreenPage } from './pages/unlock-screen.page';
import { WelcomePage } from './pages/welcome.page';

export const Pages = {
  Welcome: new WelcomePage(),
  ImportExistingWallet: new ImportExistingWalletPage(),
  SetWallet: new setWalletPage(),
  Settings: new SettingsPage(),
  RevealSecrets: new RevealSecretsPage(),
  NewSeedBackup: new NewSeedBackupPage(),
  Home: new HomePage(),
  UnlockScreen: new UnlockScreenPage(),
  DelegateTab: new DelegateTab(),
  DelegateForm: new DelegateFormPage(),
  InternalConfirmation: new InternalConfirmationPage(),
  OperationStatusAlert: new OperationStatusAlert(),
  Send: new SendPage(),
  OnRumpModal: new OnRumModalPage(),
  NewsletterModal: new NewsletterModalPage(),
  Swap: new SwapPage(),
  AddressBook: new AddressBookPage(),
  ConfirmationModal: new ConfirmationModalPage(),
  Networks: new NetworksPage(),
  ManageAssetsCollectibles: new ManageAssetsCollectiblesPage(),
  ManageAssetsTokens: new ManageAssetsTokensPage(),
  AddAsset: new AddAssetPage(),
  CollectiblePage: new CollectiblePage(),
  CollectiblesTabPage: new CollectiblesTabPage(),
  NotificationsList: new NotificationsListPage(),
  NotificationContent: new NotificationContentPage(),
  GeneralSettings: new GeneralSettingsPage()
};
