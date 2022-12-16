// import { CreateNewWalletPage } from './pages/create-new-wallet.page';
import { ImportExistingWalletPage } from './pages/importing-existing-wallet.page';
import { WelcomePage } from './pages/welcome.page';

export const Pages = {
  Welcome: new WelcomePage(),
  // CreateNewWallet: new CreateNewWalletPage(),
  ImportExistingWallet: new ImportExistingWalletPage()
};
