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

export function checkTempleTapAirdropConfirmation(accountPkh: string, sigAuthValues: SigAuthValues) {
  return templeWalletApi
    .post<boolean>(
      '/temple-tap/check-airdrop-confirmation',
      {
        accountPkh
      },
      {
        headers: buildSigAuthHeaders(sigAuthValues)
      }
    )
    .then(({ data }) => data);
}
