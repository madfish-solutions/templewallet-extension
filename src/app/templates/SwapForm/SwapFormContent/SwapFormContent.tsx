import React, { FC, useCallback, useEffect, useState } from 'react';

import { WalletOperation } from '@taquito/taquito';
import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';

import Alert from 'app/atoms/Alert';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { ReactComponent as InfoIcon } from 'app/icons/info.svg';
import { ReactComponent as ToggleIcon } from 'app/icons/toggle.svg';
import OperationStatus from 'app/templates/OperationStatus';
import { useFormAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n/react';
import { useRoutePairsCombinations } from 'lib/swap-router/hooks/use-route-pairs-combinatios.hook';
import { getBestTradeExactIn } from 'lib/swap-router/utils/best-trade.utils';
import useTippy from 'lib/ui/useTippy';

import { TradeTypeEnum } from '../../../../lib/swap-router/enum/trade-type.enum';
import styles from '../SwapForm.module.css';
import { feeInfoTippyProps, priceImpactInfoTippyProps } from './SwapFormContent.tippy';
import { SlippageToleranceInput } from './SwapFormInput/SlippageToleranceInput/SlippageToleranceInput';
import { slippageToleranceInputValidationFn } from './SwapFormInput/SlippageToleranceInput/SlippageToleranceInput.validation';
import { SwapFormInput } from './SwapFormInput/SwapFormInput';
import { SwapFormValue, SwapInputValue } from './SwapFormValue.interface';

interface Props {
  initialAssetSlug?: string;
}

export const SwapFormContent: FC<Props> = ({ initialAssetSlug }) => {
  const formAnalytics = useFormAnalytics('SwapForm');

  const feeInfoIconRef = useTippy<HTMLSpanElement>(feeInfoTippyProps);
  const priceImpactInfoIconRef = useTippy<HTMLSpanElement>(priceImpactInfoTippyProps);

  const { handleSubmit, errors, watch, setValue, control, register, triggerValidation } = useForm<SwapFormValue>({
    defaultValues: {
      input: { assetSlug: initialAssetSlug },
      output: {},
      slippageTolerance: 1
    }
  });
  const isValid = Object.keys(errors).length === 0;

  const inputValue = watch('input');
  const outputValue = watch('output');
  const slippageTolerance = watch('slippageTolerance');

  const [tradeType, setTradeType] = useState(TradeTypeEnum.EXACT_INPUT);
  const routePairsCombinations = useRoutePairsCombinations(inputValue.assetSlug, outputValue.assetSlug);

  const [error, setError] = useState<Error>();
  const [operation, setOperation] = useState<WalletOperation>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('find new best trade', routePairsCombinations.length);
    if (tradeType === TradeTypeEnum.EXACT_INPUT && inputValue.amount) {
      console.log(tradeType, inputValue.amount?.toFixed());
      const bestTradeExactIn = getBestTradeExactIn(inputValue.amount, routePairsCombinations);

      console.log(bestTradeExactIn);
    } else {
      console.log(tradeType, outputValue.amount?.toFixed());
    }
  }, [inputValue.amount, outputValue.amount, tradeType, slippageTolerance, routePairsCombinations]);

  useEffect(() => {
    register('input', {
      validate: ({ assetSlug, amount }: SwapInputValue) => {
        if (!assetSlug) {
          return 'assetMustBeSelected';
        }
        if (!amount || amount.isLessThanOrEqualTo(0)) {
          return t('amountMustBePositive');
        }

        return true;
      }
    });
    register('output', {
      validate: ({ assetSlug, amount }: SwapInputValue) => {
        if (!amount || !assetSlug) {
          return '';
        }
        if (amount.isLessThanOrEqualTo(0)) {
          return t('amountMustBePositive');
        }

        return true;
      }
    });
  }, [register]);

  const onSubmit = useCallback(
    async ({ slippageTolerance, input, output }: SwapFormValue) => {
      if (isSubmitting) {
        return;
      }
      setIsSubmitting(true);
      const analyticsProperties = {
        inputAsset: input.assetSlug,
        outputAsset: output.assetSlug
      };
      formAnalytics.trackSubmit(analyticsProperties);
      try {
        setOperation(undefined);

        // TODO: implement this
        // @ts-ignore
        // const op = await swap({});

        setError(undefined);
        formAnalytics.trackSubmitSuccess(analyticsProperties);
        // setOperation(op);
      } catch (err: any) {
        if (err.message !== 'Declined') {
          setError(err);
        }
        formAnalytics.trackSubmitFail(analyticsProperties);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, formAnalytics]
  );

  const handleErrorClose = () => setError(undefined);
  const handleOperationClose = () => setOperation(undefined);

  const handleToggleIconClick = () =>
    setValue([{ input: { assetSlug: outputValue.assetSlug } }, { output: { assetSlug: inputValue.assetSlug } }]);

  const handleInputChange = (newInputValue: SwapInputValue) => {
    setValue('input', newInputValue);

    if (newInputValue.assetSlug === outputValue.assetSlug) {
      setValue('output', {});
    }
  };
  const handleOutputChange = (newOutputValue: SwapInputValue) => {
    setValue('output', newOutputValue);

    if (newOutputValue.assetSlug === inputValue.assetSlug) {
      setValue('input', {});
    }
  };

  const handleInputAmountChange = () => setTradeType(TradeTypeEnum.EXACT_INPUT);
  const handleOutputAmountChange = () => setTradeType(TradeTypeEnum.EXACT_OUTPUT);

  return (
    <form className="mb-8" onSubmit={handleSubmit(onSubmit)}>
      {operation && (
        <OperationStatus
          className="mb-6"
          closable
          typeTitle={t('swapNoun')}
          operation={operation}
          onClose={handleOperationClose}
        />
      )}

      <SwapFormInput
        name="input"
        value={inputValue}
        // @ts-ignore
        error={errors.input?.message}
        label={<T id="from" />}
        loading={false}
        withPercentageButtons
        triggerValidation={triggerValidation}
        onChange={handleInputChange}
        onAmountChange={handleInputAmountChange}
      />

      <div className="w-full my-4 flex justify-center">
        <button onClick={handleToggleIconClick} type="button">
          <ToggleIcon className="w-6 h-auto stroke-2 stroke-current text-blue-500" />
        </button>
      </div>

      <SwapFormInput
        className="mb-6"
        name="output"
        value={outputValue}
        loading={false}
        // @ts-ignore
        error={errors.output?.message}
        isOutput={true}
        label={<T id="toAsset" />}
        triggerValidation={triggerValidation}
        onChange={handleOutputChange}
        onAmountChange={handleOutputAmountChange}
      />

      <table className={classNames('w-full text-xs text-gray-500 mb-1', styles['swap-form-table'])}>
        <tbody>
          <tr>
            <td>
              <div className="flex items-center">
                <T id="fee" />
                &nbsp;
                <span ref={feeInfoIconRef} className="text-gray-600">
                  <InfoIcon className="w-3 h-auto stroke-current" />
                </span>
                :
              </div>
            </td>
            <td className="text-right text-gray-600">-fee %</td>
          </tr>
          <tr>
            <td>
              <div className="flex items-center">
                <T id="priceImpact" />
                &nbsp;
                <span ref={priceImpactInfoIconRef} className="text-gray-600">
                  <InfoIcon className="w-3 h-auto stroke-current" />
                </span>
                :
              </div>
            </td>
            <td className="text-right text-gray-600">'-price im-'</td>
          </tr>
          <tr>
            <td>
              <T id="exchangeRate" />
            </td>
            <td className="text-right text-gray-600">'-ex rate-'</td>
          </tr>
          <tr>
            <td>
              <T id="slippageTolerance" />
            </td>
            <td className="justify-end text-gray-600 flex">
              <Controller
                control={control}
                as={SlippageToleranceInput}
                error={!!errors.slippageTolerance}
                name="slippageTolerance"
                rules={{ validate: slippageToleranceInputValidationFn }}
              />
            </td>
          </tr>
          <tr>
            <td>
              <T id="minimumReceived" />
            </td>
            <td className="text-right text-gray-600">- min Received</td>
          </tr>
        </tbody>
      </table>

      <p className="text-xs text-gray-600 mb-6">{t('templeWalletFeeWarning')}</p>

      {error && (
        <Alert
          className="mb-6"
          type="error"
          title={t('error')}
          description={error.message}
          closable
          onClose={handleErrorClose}
        />
      )}

      <FormSubmitButton
        className="w-full justify-center border-none"
        style={{
          padding: '10px 2rem',
          background: isValid ? '#4299e1' : '#c2c2c2'
        }}
        disabled={!isValid}
        loading={isSubmitting}
      >
        <T id="swap" />
      </FormSubmitButton>
    </form>
  );
};
