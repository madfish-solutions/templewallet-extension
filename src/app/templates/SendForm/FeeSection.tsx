import React from 'react';

import BigNumber from 'bignumber.js';
import { FieldError } from 'react-hook-form';

import { Alert, FormSubmitButton } from 'app/atoms';
import AdditionalFeeInput from 'app/templates/AdditionalFeeInput';
import { t, T } from 'lib/i18n';
import { useAccount, useGasToken } from 'lib/temple/front';

import SendErrorAlert from './SendErrorAlert';

interface FeeComponentProps {
  restFormDisplayed: boolean;
  submitError: any;
  estimationError: any;
  toResolved: string;
  toFilledWithKTAddress: boolean;
  control: any;
  handleFeeFieldChange: ([v]: any) => any;
  baseFee?: BigNumber | Error | undefined;
  error?: FieldError;
  isSubmitting: boolean;
}

export const FeeSection: React.FC<FeeComponentProps> = ({
  restFormDisplayed,
  submitError,
  estimationError,
  toResolved,
  toFilledWithKTAddress,
  control,
  handleFeeFieldChange,
  baseFee,
  error,
  isSubmitting
}) => {
  const acc = useAccount();
  const { metadata } = useGasToken();
  const accountPkh = acc.publicKeyHash;
  if (!restFormDisplayed) return null;
  return (
    <>
      {(() => {
        switch (true) {
          case Boolean(submitError):
            return <SendErrorAlert type="submit" error={submitError} />;

          case Boolean(estimationError):
            return <SendErrorAlert type="estimation" error={estimationError} />;

          case toResolved === accountPkh:
            return (
              <Alert
                type="warn"
                title={t('attentionExclamation')}
                description={<T id="tryingToTransferToYourself" />}
                className="mt-6 mb-4"
              />
            );

          case toFilledWithKTAddress:
            return (
              <Alert
                type="warn"
                title={t('attentionExclamation')}
                description={<T id="tryingToTransferToContract" />}
                className="mt-6 mb-4"
              />
            );

          default:
            return null;
        }
      })()}

      <AdditionalFeeInput
        name="fee"
        control={control}
        onChange={handleFeeFieldChange}
        assetSymbol={metadata.symbol}
        baseFee={baseFee}
        error={error}
        id="send-fee"
      />

      <FormSubmitButton loading={isSubmitting} disabled={Boolean(estimationError)}>
        <T id="send" />
      </FormSubmitButton>
    </>
  );
};
