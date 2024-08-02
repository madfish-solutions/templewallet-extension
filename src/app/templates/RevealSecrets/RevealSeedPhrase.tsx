import React, { memo, useCallback } from 'react';

import { T } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { StoredHDAccount, TempleAccountType } from 'lib/temple/types';
import { useDidUpdate, useVanishingState } from 'lib/ui/hooks';
import { useAccount, useAllAccounts } from 'temple/front';

import { PasswordForRevealField } from './PasswordForRevealField';
import { SecretField } from './SecretField';

export const RevealSeedPhrase = memo(() => {
  const { revealMnemonic } = useTempleClient();

  const allAccounts = useAllAccounts();
  const currentAccount = useAccount();
  const walletId =
    currentAccount.type === TempleAccountType.HD
      ? currentAccount.walletId
      : allAccounts.find((acc): acc is StoredHDAccount => acc.type === TempleAccountType.HD)!.walletId;

  const [secret, setSecret] = useVanishingState();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useDidUpdate(() => void setSecret(null), [currentAccount.id, setSecret]);

  const onPasswordSubmit = useCallback(
    async (password: string) => revealMnemonic(walletId, password).then(scrt => void setSecret(scrt)),
    [revealMnemonic, walletId, setSecret]
  );

  return (
    <div className="w-full max-w-sm p-2 mx-auto">
      <DerivationPathBanner />

      {secret ? (
        <SecretField value={secret} revealType="seed-phrase" />
      ) : (
        <PasswordForRevealField labelDescriptionForName="seedPhrase" onSubmit={onPasswordSubmit} />
      )}
    </div>
  );
});

const DerivationPathBanner = memo(() => (
  <div className="mb-6 flex flex-col">
    <h2 className="mb-4 leading-tight flex flex-col">
      <span className="text-font-regular-bold text-gray-700">
        <T id="derivationPath" />
      </span>

      <span className="mt-1 text-font-description font-light text-gray-600 max-w-9/10">
        <T id="pathForHDAccounts" />
      </span>
    </h2>

    <h3 className="text-font-medium-bold text-gray-700">Tezos:</h3>

    <div className="mt-1 w-full border rounded-md p-2 flex items-center">
      <span className="text-font-medium font-medium text-gray-800">
        <T id="derivationPathExample" />
      </span>
    </div>

    <h3 className="mt-2 text-font-medium-bold text-gray-700">EVM:</h3>

    <div className="mt-1 w-full border rounded-md p-2 flex items-center">
      <span className="text-font-medium font-medium text-gray-800">{`m/44'/60'/0'/0/<address_index>`}</span>
    </div>
  </div>
));
