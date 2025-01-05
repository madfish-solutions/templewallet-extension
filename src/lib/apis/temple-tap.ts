import { templeWalletApi } from './temple/endpoints/templewallet.api';
import { buildSigAuthHeaders, SigAuthValues } from './temple/sig-auth';

export function sendTempleTapAirdropUsernameConfirmation(
  accountPkh: string,
  username: string,
  sigAuthValues: SigAuthValues
) {
  return templeWalletApi.post<{ status: string }>(
    '/temple-tap/confirm-airdrop-username',
    {
      accountPkh,
      username
    },
    {
      headers: buildSigAuthHeaders(sigAuthValues)
    }
  );
}
