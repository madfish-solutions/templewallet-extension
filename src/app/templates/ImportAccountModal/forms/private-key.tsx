import React, { memo, ReactNode, useCallback, useMemo, useState } from 'react';

import { Prefix } from '@taquito/utils';
import { useForm } from 'react-hook-form';

import { FormField } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { StyledButton } from 'app/atoms/StyledButton';
import { TextButton } from 'app/atoms/TextButton';
import { ReactComponent as PasteFillIcon } from 'app/icons/base/paste_fill.svg';
import { useFormAnalytics } from 'lib/analytics';
import { DEFAULT_PASSWORD_INPUT_PLACEHOLDER } from 'lib/constants';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { shouldDisableSubmitButton } from 'lib/ui/should-disable-submit-button';
import { clearClipboard, readClipboard } from 'lib/ui/utils';
import { TempleChainKind } from 'temple/types';

import { ImportAccountSelectors, ImportAccountFormType } from '../selectors';
import { ImportAccountFormProps } from '../types';

interface ByPrivateKeyFormData {
  privateKey: string;
  encPassword?: string;
}

export const PrivateKeyForm = memo<ImportAccountFormProps>(({ onSuccess }) => {
  const { importAccount } = useTempleClient();
  const formAnalytics = useFormAnalytics(ImportAccountFormType.PrivateKey);

  const { register, handleSubmit, errors, formState, watch, setValue, triggerValidation } =
    useForm<ByPrivateKeyFormData>({ mode: 'onChange' });
  const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(true);
  const [submitError, setSubmitError] = useState<ReactNode>(null);
  const resetSubmitError = useCallback(() => setSubmitError(null), []);

  const onSubmit = useCallback(
    async ({ privateKey, encPassword }: ByPrivateKeyFormData) => {
      if (formState.isSubmitting) return;

      formAnalytics.trackSubmit();
      setSubmitError(null);
      let chain: TempleChainKind | undefined;
      try {
        const [finalPrivateKey, chain] = toPrivateKeyWithChain(privateKey.replace(/\s/g, ''));

        await importAccount(chain, finalPrivateKey, encPassword);

        formAnalytics.trackSubmitSuccess({ chain });
        onSuccess();
      } catch (err: any) {
        formAnalytics.trackSubmitFail({ chain });

        console.error(err);

        setSubmitError(err.message);
      }
    },
    [formState.isSubmitting, formAnalytics, importAccount, onSuccess]
  );

  const pastePrivateKey = useCallback(
    () =>
      readClipboard()
        .then(value => {
          setValue('privateKey', value);
          clearClipboard();
          setSubmitError(null);
          triggerValidation('privateKey');
        })
        .catch(console.error),
    [setValue, triggerValidation]
  );
  const cleanPrivateKeyField = useCallback(() => {
    setValue('privateKey', '');
    setValue('encPassword', undefined);
    setSubmitError(null);
    triggerValidation('privateKey');
    triggerValidation('encPassword');
  }, [setValue, triggerValidation]);

  const keyValue = watch('privateKey') as string | undefined;
  const encrypted = useMemo(() => isTezosPrivateKey(keyValue) && keyValue.substring(2, 3) === 'e', [keyValue]);

  return (
    <form className="flex-1 flex flex-col max-h-full" onSubmit={handleSubmit(onSubmit)}>
      <ScrollView className="py-4" bottomEdgeThreshold={16} onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}>
        <FormField
          textarea
          rows={5}
          ref={register({ required: t('required') })}
          type="password"
          revealForbidden
          name="privateKey"
          id="importacc-privatekey"
          label={t('privateKey')}
          placeholder={t('privateKeyInputPlaceholder')}
          errorCaption={errors.privateKey?.message ?? submitError}
          shouldShowErrorCaption
          className="resize-none"
          containerClassName="mb-8"
          cleanable={Boolean(keyValue)}
          onClean={cleanPrivateKeyField}
          onChange={resetSubmitError}
          additonalActionButtons={
            keyValue ? null : (
              <TextButton
                color="blue"
                Icon={PasteFillIcon}
                onClick={pastePrivateKey}
                testID={ImportAccountSelectors.pastePrivateKeyButton}
              >
                <T id="paste" />
              </TextButton>
            )
          }
          onPaste={clearClipboard}
          testID={ImportAccountSelectors.privateKeyInput}
        />

        {encrypted && (
          <FormField
            ref={register}
            name="encPassword"
            type="password"
            id="importacc-password"
            labelContainerClassName="w-full flex justify-between items-center"
            label={
              <>
                <T id="password" />
                <span className="text-font-description font-normal text-grey-2">
                  <T id="optionalComment" />
                </span>
              </>
            }
            onChange={resetSubmitError}
            placeholder={DEFAULT_PASSWORD_INPUT_PLACEHOLDER}
            errorCaption={errors.encPassword?.message}
          />
        )}
      </ScrollView>

      <ActionsButtonsBox shouldCastShadow={!bottomEdgeIsVisible}>
        <StyledButton
          size="L"
          type="submit"
          disabled={shouldDisableSubmitButton({ errors, formState, otherErrors: [submitError] })}
          testID={ImportAccountSelectors.privateKeyImportButton}
          color="primary"
        >
          <T id="importAccount" />
        </StyledButton>
      </ActionsButtonsBox>
    </form>
  );
});

function toPrivateKeyWithChain(value: string): [string, TempleChainKind] {
  if (isTezosPrivateKey(value)) return [value, TempleChainKind.Tezos];

  if (!value.startsWith('0x')) value = `0x${value}`;

  return [value, TempleChainKind.EVM];
}

const secretKeyPrefixes = [Prefix.EDSK, Prefix.SPSK, Prefix.P2SK, Prefix.EDESK, Prefix.SPESK, Prefix.P2ESK] as const;
type TezosSecretKey = `${(typeof secretKeyPrefixes)[number]}${string}`;

const isTezosPrivateKey = (value?: string): value is TezosSecretKey =>
  secretKeyPrefixes.some(p => value?.startsWith(p));
