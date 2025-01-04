import { templeWalletApi } from './temple/endpoints/templewallet.api';

export function sendTempleTapAirdropUsernameConfirmation(accountPkh: string, username: string) {
  return templeWalletApi.post<{ status: string }>('/temple-tap/confirm-airdrop-username', {
    accountPkh,
    username
  });
}
