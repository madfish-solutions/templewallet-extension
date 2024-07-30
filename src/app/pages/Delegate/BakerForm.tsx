import React, { FC, ReactNode, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { Control, FieldError, FormStateProxy, NestDataObject } from 'react-hook-form';

import { Alert, FormSubmitButton } from 'app/atoms';
import Money from 'app/atoms/Money';
import Spinner from 'app/atoms/Spinner/Spinner';
import { ArtificialError, NotEnoughFundsError, ZeroBalanceError } from 'app/defaults';
import { useUserTestingGroupNameSelector } from 'app/store/ab-testing/selectors';
import AdditionalFeeInput from 'app/templates/AdditionalFeeInput/AdditionalFeeInput';
import { BakerCard, BAKER_BANNER_CLASSNAME } from 'app/templates/BakerBanner';
import { ABTestGroup } from 'lib/apis/temple';
import { TEZOS_SYMBOL, getTezosGasSymbol } from 'lib/assets';
import { T, t } from 'lib/i18n';
import { HELP_UKRAINE_BAKER_ADDRESS, RECOMMENDED_BAKER_ADDRESS } from 'lib/known-bakers';
import { Baker } from 'lib/temple/front';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';

import { KnownDelegatorsList } from './DelegatorsList';
import { UnchangedError, UnregisteredDelegateError } from './errors';
import { DelegateFormSelectors } from './selectors';

interface FormData {
  to: string;
  fee: number;
}

export interface BakerFormProps {
  tezosChainId: string;
  accountPkh: string;
  baker: Baker | null | undefined;
  toFilled: boolean | '';
  balance: BigNumber;
  submitError: ReactNode;
  estimationError: any;
  estimating: boolean;
  bakerValidating: boolean;
  baseFee?: BigNumber | ArtificialError | UnchangedError | UnregisteredDelegateError;
  control: Control<FormData>;
  handleFeeFieldChange: ([v]: any) => any;
  errors: NestDataObject<FormData, FieldError>;
  setValue: any;
  triggerValidation: (payload?: string | string[] | undefined, shouldRender?: boolean | undefined) => Promise<boolean>;
  formState: FormStateProxy<FormData>;
}

export const BakerForm: React.FC<BakerFormProps> = ({
  tezosChainId,
  accountPkh,
  baker,
  balance,
  submitError,
  estimationError,
  estimating,
  bakerValidating,
  toFilled,
  baseFee,
  control,
  errors,
  handleFeeFieldChange,
  setValue,
  triggerValidation,
  formState
}) => {
  const testGroupName = useUserTestingGroupNameSelector();
  const estimateFallbackDisplayed = toFilled && !baseFee && (estimating || bakerValidating);

  const bakerTestMessage = useMemo(() => {
    if (baker?.address !== RECOMMENDED_BAKER_ADDRESS) {
      return 'Unknown Delegate Button';
    }

    if (testGroupName === ABTestGroup.B) {
      return 'Known B Delegate Button';
    }

    return 'Known A Delegate Button';
  }, [baker?.address, RECOMMENDED_BAKER_ADDRESS]);

  if (estimateFallbackDisplayed) {
    return (
      <div className="flex justify-center my-8">
        <Spinner className="w-20" />
      </div>
    );
  }

  const restFormDisplayed = Boolean(toFilled && (baseFee || estimationError));
  const tzError = submitError || estimationError;

  if (!restFormDisplayed)
    return (
      <KnownDelegatorsList
        tezosChainId={tezosChainId}
        accountPkh={accountPkh}
        setValue={setValue}
        triggerValidation={triggerValidation}
      />
    );

  return (
    <>
      {baker?.address === HELP_UKRAINE_BAKER_ADDRESS && (
        <Alert
          type="delegate"
          title={t('helpUkraineDisclainerTitle')}
          description={t('helpUkraineDisclainerDescription')}
          className="mb-6"
        />
      )}

      <BakerBannerComponent
        tezosChainId={tezosChainId}
        accountPkh={accountPkh}
        balanceNum={balance.toNumber()}
        baker={baker}
        tzError={tzError}
      />

      {tzError && (
        <DelegateErrorAlert type={submitError ? 'submit' : 'estimation'} error={tzError} tezosChainId={tezosChainId} />
      )}

      <AdditionalFeeInput
        name="fee"
        control={control}
        onChange={handleFeeFieldChange}
        gasSymbol={TEZOS_SYMBOL}
        baseFee={baseFee}
        error={errors.fee}
        id="delegate-fee"
      />

      <FormSubmitButton
        loading={formState.isSubmitting}
        disabled={Boolean(estimationError)}
        testID={DelegateFormSelectors.bakerDelegateButton}
        testIDProperties={{
          message: bakerTestMessage
        }}
      >
        {t('delegate')}
      </FormSubmitButton>
    </>
  );
};

interface BakerBannerComponentProps {
  tezosChainId: string;
  accountPkh: string;
  balanceNum: number;
  baker: Baker | null | undefined;
  tzError: any;
}

const BakerBannerComponent = React.memo<BakerBannerComponentProps>(
  ({ tezosChainId, accountPkh, balanceNum, tzError, baker }) => {
    const isMainnet = tezosChainId === TEZOS_MAINNET_CHAIN_ID;
    const symbol = getTezosGasSymbol(tezosChainId);

    return baker ? (
      <>
        <BakerCard
          tezosChainId={tezosChainId}
          accountPkh={accountPkh}
          bakerPkh={baker.address}
          hideAddress
          showBakerTag
          className={clsx(BAKER_BANNER_CLASSNAME, 'mb-6')}
        />

        {!tzError && baker.minDelegation > balanceNum && (
          <Alert
            type="warning"
            title={t('minDelegationAmountTitle')}
            description={
              <T
                id="minDelegationAmountDescription"
                substitutions={[
                  <span className="font-normal" key="minDelegationsAmount">
                    <Money>{baker.minDelegation}</Money> <span style={{ fontSize: '0.75em' }}>{symbol}</span>
                  </span>
                ]}
              />
            }
            className="mb-6"
          />
        )}
      </>
    ) : !tzError && isMainnet ? (
      <Alert
        type="warning"
        title={t('unknownBakerTitle')}
        description={t('unknownBakerDescription')}
        className="mb-6"
      />
    ) : null;
  }
);

interface DelegateErrorAlertProps {
  type: 'submit' | 'estimation';
  error: Error;
  tezosChainId: string;
}

const DelegateErrorAlert: FC<DelegateErrorAlertProps> = ({ type, error, tezosChainId }) => {
  return (
    <Alert
      type={type === 'submit' ? 'error' : 'warning'}
      title={(() => {
        switch (true) {
          case error instanceof NotEnoughFundsError:
            return `${t('notEnoughFunds')} 😶`;

          case [UnchangedError, UnregisteredDelegateError].some(Err => error instanceof Err):
            return t('notAllowed');

          default:
            return t('failed');
        }
      })()}
      description={(() => {
        switch (true) {
          case error instanceof ZeroBalanceError:
            return t('yourBalanceIsZero');

          case error instanceof NotEnoughFundsError:
            return t('minimalFeeGreaterThanBalance');

          case error instanceof UnchangedError:
            return t('alreadyDelegatedFundsToBaker');

          case error instanceof UnregisteredDelegateError:
            return t('bakerNotRegistered');

          default:
            return (
              <>
                <T
                  id="unableToPerformActionToBaker"
                  substitutions={t(type === 'submit' ? 'delegate' : 'estimateDelegation').toLowerCase()}
                />

                <br />

                <T id="thisMayHappenBecause" />

                <ul className="mt-1 ml-2 text-xs list-disc list-inside">
                  <li>
                    <T id="minimalFeeGreaterThanBalanceVerbose" substitutions={getTezosGasSymbol(tezosChainId)} />
                  </li>

                  <li>
                    <T id="networkOrOtherIssue" />
                  </li>
                </ul>
              </>
            );
        }
      })()}
      autoFocus
      className="mt-6 mb-4"
    />
  );
};
