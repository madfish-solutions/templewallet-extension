import { templeWalletApi } from './temple/endpoints/templewallet.api';

export function sendTempleTapAirdropUsernameConfirmation(accountPkh: string, username: string) {
  return templeWalletApi.post('/temple-tap/confirm-airdrop-username', {
    accountPkh,
    username
  });
}
