import { AddressBookPage } from '../page-objects/pages/address-book.page';
import { CollectiblePage } from '../page-objects/pages/collectible.page';
import { CollectiblesTabPage } from '../page-objects/pages/CollectiblesTab.page';
import { ConfirmationModalPage } from '../page-objects/pages/confirmation-modal.page';
import { GeneralSettingsPage } from '../page-objects/pages/general-settings.page';
import { HomePage } from '../page-objects/pages/home.page';
import { BackupOptionsModalPage } from '../page-objects/pages/modal/backup-options-modal.page';
import { NetworksPage } from '../page-objects/pages/networks.page';
import { NotificationContentPage } from '../page-objects/pages/notification-content.page';
import { NotificationsListPage } from '../page-objects/pages/notifications-list.page';
import { SwapPage } from '../page-objects/pages/swap.page';

import { OperationStatusAlert } from './pages/alerts/operation-status.alert';
import { DelegateFormPage } from './pages/delegate-form.page';
import { DelegateTab } from './pages/delegate-tab.page';
import { ImportExistingWalletPage } from './pages/importing-existing-wallet.page';
import { InternalConfirmationPage } from './pages/internal-confirmation.page';
import { AddNewWalletListPage } from './pages/lists/add-new-wallet-list.page';
import { AccountsModalPage } from './pages/modal/accounts-modal.page';
import { ManualBackupModalPage } from './pages/modal/manual-backup-modal.page';
import { NewsletterModalPage } from './pages/modal/newsletter-modal.page';
import { OnRumModalPage } from './pages/modal/on-rum-modal.page';
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
  CollectiblePage: new CollectiblePage(),
  CollectiblesTabPage: new CollectiblesTabPage(),
  NotificationsList: new NotificationsListPage(),
  NotificationContent: new NotificationContentPage(),
  GeneralSettings: new GeneralSettingsPage(),
  ManualBackupModal: new ManualBackupModalPage(),
  BackupOptionsModal: new BackupOptionsModalPage(),
  Home: new HomePage(),
  AccountsModal: new AccountsModalPage(),
  AddNewWalletList: new AddNewWalletListPage()
};
