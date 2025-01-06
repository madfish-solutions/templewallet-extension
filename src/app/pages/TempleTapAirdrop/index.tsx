import React, { FC, memo, PropsWithChildren, useCallback, useMemo, useState } from 'react';

import { OnSubmit, useForm } from 'react-hook-form';

import { Alert, Anchor, FormField, FormSubmitButton } from 'app/atoms';
import { ReactComponent as TelegramSvg } from 'app/icons/social-tg.svg';
import { ReactComponent as XSocialSvg } from 'app/icons/social-x.svg';
import PageLayout from 'app/layouts/PageLayout';
import { makeSigAuthMessageBytes, SigAuthValues } from 'lib/apis/temple/sig-auth';
import { checkTempleTapAirdropConfirmation, sendTempleTapAirdropUsernameConfirmation } from 'lib/apis/temple-tap';
import { t } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { useAccount, useTempleClient, useTezos } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';
import { useLocalStorage } from 'lib/ui/local-storage';

import BannerImgSrc from './banner.png';
import { ReactComponent as ConfirmedSvg } from './confirmed.svg';

interface FormData {
  username: string;
}

export const TempleTapAirdropPage = memo(() => {
  const account = useAccount();
  const accountPkh = account.publicKeyHash;

  const tezos = useTezos();
  const { silentSign } = useTempleClient();

  const canSign = useMemo(
    () => [TempleAccountType.HD, TempleAccountType.Imported, TempleAccountType.Ledger].includes(account.type),
    [account.type]
  );

  const [storedRecord, setStoredRecord] = useLocalStorage<LocalStorageRecord | null>(
    'TEMPLE_TAP_AIRDROP_PKH_CONFIRMATIONS',
    null
  );

  const [confirmSent, setConfirmSent] = useState(false);
  const [confirmed, setConfirmed] = useState(storedRecord?.[accountPkh] ?? false);

  const prepSigAuthValues = useCallback(async (): Promise<SigAuthValues> => {
    const [messageBytes, publicKey] = await Promise.all([
      makeSigAuthMessageBytes(accountPkh),
      tezos.signer.publicKey()
    ]);

    const { prefixSig: signature } = await silentSign(accountPkh, messageBytes);

    return { publicKey, messageBytes, signature };
  }, [silentSign, tezos.signer, accountPkh]);

  useTypedSWR(
    ['temple-tap-airdrop-confirm-check', accountPkh],
    async () => {
      if (confirmed || !canSign) return null;

      const sigAuthValues = await prepSigAuthValues();

      const confirmedRes = await checkTempleTapAirdropConfirmation(accountPkh, sigAuthValues);

      if (!confirmedRes) return null;

      setConfirmed(true);
      setStoredRecord(state => ({ ...state, [accountPkh]: true }));

      return null;
    },
    {
      suspense: true,
      revalidateOnFocus: false,
      refreshInterval: 60_000,
      errorRetryInterval: 60_000
    }
  );

  const { register, handleSubmit, errors, setError, clearError, formState, reset } = useForm<FormData>();

  const submitting = formState.isSubmitting;

  const onSubmit = useCallback<OnSubmit<FormData>>(
    async ({ username }) => {
      clearError();

      try {
        const sigAuthValues = await prepSigAuthValues();

        const res = await sendTempleTapAirdropUsernameConfirmation(accountPkh, username, sigAuthValues);

        switch (res.data.status) {
          case 'ACCEPTED':
            setConfirmSent(true);
            break;
          case 'CONFIRMED':
            setConfirmed(true);
            setStoredRecord(state => ({ ...state, [accountPkh]: true }));
            break;
        }

        reset();
      } catch (error: any) {
        console.error(error);

        setError('username', 'submit-error', error?.response?.data?.message || 'Something went wrong...');
      }
    },
    [reset, clearError, setError, setStoredRecord, prepSigAuthValues, accountPkh]
  );

  return (
    <PageLayout pageTitle="Temple Tap Airdrop" withBell>
      <div className="flex flex-col w-full max-w-sm mx-auto pb-6">
        <img src={BannerImgSrc} alt="Banner" className="self-center h-28" />

        <span className="mt-6 text-dark font-semibold" style={{ fontSize: 19 }}>
          Airdrop criteria
        </span>

        <p className="mt-2 text-dark-gray text-sm">
          All users who played Temple Tap are eligible to share the prize pool and receive a TKEY airdrop directly to
          Tezos address.
        </p>

        <span className="mt-8 text-dark-gray text-base leading-tighter font-medium">How to receive TKEY?</span>

        {confirmSent && !confirmed && (
          <Alert
            type="success"
            title={`${t('success')} ${confirmed ? '✅' : '🛫'}`}
            description="Confirmation sent to Temple Tap bot! Waiting for approve..."
            autoFocus
            className="mt-4"
          />
        )}

        {canSign ? (
          confirmed ? (
            <BlockComp
              title="Address confirmed"
              description="Your address has been successfully confirmed in Temple Tap bot for future airdrop distribution."
            >
              <ConfirmedSvg className="w-6 h-6 absolute top-4 right-4" />
            </BlockComp>
          ) : (
            <BlockComp
              title="Confirm address"
              description="Enter your telegram @username to confirm your Tezos address in Temple Tap bot for future airdrop distribution"
            >
              <div className="text-xs leading-5 text-dark-gray">
                <span>Your address: </span>
                <span>{accountPkh}</span>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="contents">
                <FormField
                  ref={register({
                    pattern: {
                      value: TG_USERNAME_REGEX,
                      message:
                        "Starts with '@'. You can use a-z, A-Z, 0-9 and '_' in between. Minimum length is 6 characters."
                    }
                  })}
                  name="username"
                  placeholder="@username"
                  className="mt-4"
                  style={{ backgroundColor: 'white' }}
                  disabled={submitting}
                  errorCaption={errors.username?.message}
                />

                <FormSubmitButton type="submit" loading={submitting} className="mt-4">
                  Confirm
                </FormSubmitButton>
              </form>
            </BlockComp>
          )
        ) : (
          <Alert description="Please, use a signer account to pursue." className="mt-4" />
        )}

        <BlockComp
          title="Stay tuned for news"
          description="Follow us on social media to be the first to hear about airdrop updates!"
        >
          <div className="h-1" />

          <SocialItem title="Temple Wallet on X" IconComp={XSocialSvg} followUrl="https://x.com/TempleWallet" />

          <SocialItem title="MadFish Community" IconComp={TelegramSvg} followUrl="https://t.me/MadFishCommunity" />
        </BlockComp>
      </div>
    </PageLayout>
  );
});

type LocalStorageRecord = StringRecord<true>;

interface BlockCompProps {
  title: string;
  description: string;
}

const BlockComp: FC<PropsWithChildren<BlockCompProps>> = ({ title, description, children }) => (
  <div className="mt-4 relative flex flex-col p-4 bg-gray-100 rounded-xl">
    <span className="text-sm font-semibold text-dark">{title}</span>

    <p className="my-1 pr-4 text-xs leading-5 text-gray-600">{description}</p>

    {children}
  </div>
);

interface SocialItemProps {
  title: string;
  IconComp: ImportedSVGComponent;
  followUrl: string;
}

const SocialItem: FC<SocialItemProps> = ({ title, IconComp, followUrl }) => (
  <div className="mt-2 flex items-center gap-x-3 py-3 px-4 bg-white rounded-xl">
    <div className="w-10 h-10 p-3 bg-blue-150 rounded-full">
      <IconComp className="w-4 h-4 stroke-current fill-current text-dark" />
    </div>

    <span className="flex-grow text-sm font-semibold text-dark">{title}</span>

    <Anchor href={followUrl} className="p-2 text-sm leading-none font-semibold text-white bg-blue-550 rounded-lg">
      Follow
    </Anchor>
  </div>
);

const TG_USERNAME_REGEX = /^@[a-zA-Z0-9](?:[a-zA-Z0-9_]{3,}[a-zA-Z0-9])$/;
