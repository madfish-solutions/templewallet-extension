import React, { FC, memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { Alert } from 'app/atoms';
import { getAccountBadgeTitle } from 'app/defaults';
import AccountBanner from 'app/templates/AccountBanner';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';
import { useDidUpdate, useVanishingState } from 'lib/ui/hooks';
import { AccountForChain } from 'temple/accounts';
import { useAccountForEvm, useAccountForTezos } from 'temple/front';
import { TempleChainTitle } from 'temple/types';

import { PasswordForRevealField } from './PasswordForRevealField';
import { SecretField } from './SecretField';

export const RevealPrivateKeys = memo(() => {
  const accForTezos = useAccountForTezos();
  const accForEvm = useAccountForEvm();

  return (
    <>
      {accForTezos ? <RevealForChain account={accForTezos} /> : null}
      {accForEvm ? <RevealForChain account={accForEvm} /> : null}
    </>
  );
});

interface RevealForChainProps {
  account: AccountForChain;
}

const RevealForChain: FC<RevealForChainProps> = ({ account }) => {
  const { chain, address } = account;

  const { revealPrivateKey } = useTempleClient();

  const [secret, setSecret] = useVanishingState();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useDidUpdate(() => void setSecret(null), [account.id, setSecret]);

  const onPasswordSubmit = useCallback(
    async (password: string) => revealPrivateKey(chain, address, password).then(scrt => void setSecret(scrt)),
    [chain, address, setSecret, revealPrivateKey]
  );

  const mainContent = useMemo(() => {
    const forbidRevealing = [
      TempleAccountType.Ledger,
      TempleAccountType.ManagedKT,
      TempleAccountType.WatchOnly
    ].includes(account.type);

    if (forbidRevealing) {
      return (
        <Alert
          title={t('privateKeyCannotBeRevealed')}
          description={
            <p>
              <T
                id="youCannotGetPrivateKeyFromThisAccountType"
                substitutions={[
                  <span
                    key="account-type"
                    className="rounded-sm border px-1 py-px font-normal leading-tight border-current"
                    style={{
                      fontSize: '0.75em'
                    }}
                  >
                    {getAccountBadgeTitle(account.type)}
                  </span>
                ]}
              />
            </p>
          }
          className="my-4"
        />
      );
    }

    if (secret) return <SecretField value={secret} revealType="private-key" />;

    return <PasswordForRevealField labelDescriptionForName="privateKey" onSubmit={onPasswordSubmit} />;
  }, [account.type, secret, onPasswordSubmit]);

  return (
    <div className="mt-6 w-full max-w-sm p-2 mx-auto">
      <AccountBanner
        account={account}
        label={`${TempleChainTitle[chain]} Account`}
        labelDescription={t('ifYouWantToRevealPrivateKeyFromOtherAccount')}
        className="mb-6"
      />

      {account.derivationPath && (
        <div className="mb-6 flex flex-col">
          <label className="mb-4 flex flex-col">
            <span className="text-base font-semibold text-gray-700">
              <T id="derivationPath" />
            </span>
          </label>
          <input
            className={clsx(
              'appearance-none w-full py-3 pl-4',
              'rounded-md border-2 border-gray-300',
              'bg-transparent text-gray-700 text-lg leading-tight'
            )}
            disabled={true}
            value={account.derivationPath}
          />
        </div>
      )}

      {mainContent}
    </div>
  );
};
