import { HeaderPage } from './pages/header.page';
import { ImportExistingWalletPage } from './pages/importing-existing-wallet.page';
import { setWalletPage } from './pages/setWalletPassword.page';
import { WelcomePage } from './pages/welcome.page';

export const Pages = {
  Welcome: new WelcomePage(),
  ImportExistingWallet: new ImportExistingWalletPage(),
  SetWallet: new setWalletPage(),
  Header: new HeaderPage()
};
