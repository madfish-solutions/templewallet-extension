import React, { FC, memo, useMemo } from 'react';

import { Estimate } from '@taquito/taquito/dist/types/contract/estimate';
import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import Identicon from 'app/atoms/Identicon';
import Money from 'app/atoms/Money';
import PlainAssetInput from 'app/atoms/PlainAssetInput';
import { ReactComponent as ClipboardIcon } from 'app/icons/clipboard.svg';
import HashChip from 'app/templates/HashChip';
import InUSD from 'app/templates/InUSD';
import { T, t, TProps } from 'lib/i18n/react';
import {
  getAssetSymbol,
  mutezToTz,
  RawOperationAssetExpense,
  RawOperationExpenses,
  tzToMutez,
  useAssetMetadata
} from 'lib/temple/front';

type OperationAssetExpense = Omit<RawOperationAssetExpense, 'tokenAddress'> & {
  assetSlug: string;
};

type OperationExpenses = Omit<RawOperationExpenses, 'expenses'> & {
  expenses: OperationAssetExpense[];
};

type ExpensesViewProps = {
  expenses?: OperationExpenses[];
  estimates?: Estimate[];
  mainnet?: boolean;
  modifyFeeAndLimit?: ModifyFeeAndLimit;
  gasFeeError?: boolean;
};

export interface ModifyFeeAndLimit {
  totalFee: number;
  onTotalFeeChange: (totalFee: number) => void;
  storageLimit: number | null;
  onStorageLimitChange: (storageLimit: number) => void;
}

const MAX_GAS_FEE = 1000;

const ExpensesView: FC<ExpensesViewProps> = ({ expenses, estimates, mainnet, modifyFeeAndLimit, gasFeeError }) => {
  const modifyFeeAndLimitSection = useMemo(() => {
    if (!modifyFeeAndLimit) return null;

    if (estimates) {
      let defaultGasFeeMutez = new BigNumber(0);
      let storageFeeMutez = new BigNumber(0);
      try {
        let i = 0;
        for (const e of estimates) {
          defaultGasFeeMutez = defaultGasFeeMutez.plus(e.suggestedFeeMutez);
          storageFeeMutez = storageFeeMutez.plus(
            Math.ceil(
              (i === 0 ? modifyFeeAndLimit.storageLimit ?? e.storageLimit : e.storageLimit) *
                (e as any).minimalFeePerStorageByteMutez
            )
          );
          i++;
        }
      } catch {
        return null;
      }

      const gasFee = mutezToTz(modifyFeeAndLimit.totalFee);
      const defaultGasFee = mutezToTz(defaultGasFeeMutez);
      const storageFee = mutezToTz(storageFeeMutez);

      return (
        <div className="w-full flex flex-col">
          {[
            {
              key: 'totalFee',
              title: t('gasFee'),
              value: gasFee,
              onChange: modifyFeeAndLimit.onTotalFeeChange
            },
            {
              key: 'storageFeeMax',
              title: t('storageFeeMax'),
              value: storageFee
            },
            ...(modifyFeeAndLimit.storageLimit !== null
              ? [
                  {
                    key: 'storageLimit',
                    title: t('storageLimit'),
                    value: modifyFeeAndLimit.storageLimit,
                    onChange: modifyFeeAndLimit.onStorageLimitChange
                  }
                ]
              : [])
          ].map(({ key, title, value, onChange }, i, arr) => (
            <div key={key} className={classNames('w-full flex items-center', i !== arr.length - 1 && 'mb-1')}>
              <div
                className={classNames('whitespace-no-wrap overflow-x-auto no-scrollbar', 'opacity-90')}
                style={{ maxWidth: '45%' }}
              >
                {title}
              </div>
              <div className="mr-1">:</div>

              <div className="flex-1" />

              {value instanceof BigNumber ? (
                <>
                  <div className="mr-1">
                    {onChange ? (
                      <>
                        <PlainAssetInput
                          value={value.toFixed()}
                          onChange={val => {
                            onChange?.(tzToMutez(val ?? defaultGasFee).toNumber());
                          }}
                          max={MAX_GAS_FEE}
                          placeholder={defaultGasFee.toFixed()}
                          className={classNames(
                            'mr-1',
                            'appearance-none',
                            'w-24',
                            'py-px px-1',
                            'border',
                            gasFeeError ? 'border-red-300' : 'border-gray-300',
                            'focus:border-primary-orange',
                            'bg-gray-100 focus:bg-transparent',
                            'focus:outline-none focus:shadow-outline',
                            'transition ease-in-out duration-200',
                            'rounded',
                            'text-right',
                            'text-gray-700 text-sm leading-tight',
                            'placeholder-gray-600'
                          )}
                        />
                        ꜩ
                      </>
                    ) : (
                      <>
                        <span className="font-medium">
                          <Money>{value}</Money>
                        </span>{' '}
                        ꜩ
                      </>
                    )}
                  </div>

                  <InUSD volume={value} roundingMode={BigNumber.ROUND_UP} mainnet={mainnet}>
                    {usdAmount => (
                      <div>
                        <span className="opacity-75">(</span>
                        <span className="pr-px">$</span>
                        {usdAmount}
                        <span className="opacity-75">)</span>
                      </div>
                    )}
                  </InUSD>
                </>
              ) : (
                <input
                  type="number"
                  value={value || ''}
                  onChange={e => {
                    if (e.target.value.length > 8) return;
                    const val = +e.target.value;
                    onChange?.(val > 0 ? val : 0);
                  }}
                  placeholder="0"
                  className={classNames(
                    'appearance-none',
                    'w-24',
                    'py-px pl-1',
                    'border',
                    'border-gray-300',
                    'focus:border-primary-orange',
                    'bg-gray-100 focus:bg-transparent',
                    'focus:outline-none focus:shadow-outline',
                    'transition ease-in-out duration-200',
                    'rounded',
                    'text-right',
                    'text-gray-700 text-sm leading-tight',
                    'placeholder-gray-600'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      );
    }

    return null;
  }, [modifyFeeAndLimit, estimates, mainnet, gasFeeError]);

  if (!expenses) {
    return null;
  }

  return (
    <div
      className={classNames(
        'relative rounded-md overflow-y-auto border',
        'flex flex-col text-gray-700 text-sm leading-tight'
      )}
      style={{ height: gasFeeError ? '10rem' : '11rem' }}
    >
      {expenses.map((item, index, arr) => (
        <ExpenseViewItem key={index} item={item} last={index === arr.length - 1} mainnet={mainnet} />
      ))}

      {modifyFeeAndLimit && (
        <>
          <div className="flex-1" />

          <div
            className={classNames(
              'sticky bottom-0 left-0 right-0',
              'flex items-center',
              'px-2 py-1',
              'bg-gray-200 bg-opacity-90 border-t',
              'text-sm text-gray-700'
            )}
          >
            {modifyFeeAndLimitSection ?? (
              <span>
                <T id="txIsLikelyToFail" />
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ExpensesView;

type ExpenseViewItemProps = {
  item: OperationExpenses;
  last: boolean;
  mainnet?: boolean;
};

const ExpenseViewItem: FC<ExpenseViewItemProps> = ({ item, last, mainnet }) => {
  const operationTypeLabel = useMemo(() => {
    switch (item.type) {
      // TODO: add translations for other operations types
      case 'transaction':
      case 'transfer':
        return `↑ ${t('transfer')}`;
      case 'approve':
        return t('approveToken');
      case 'delegation':
        return item.delegate ? t('delegation') : t('undelegation');
      default:
        return item.isEntrypointInteraction ? (
          <>
            <ClipboardIcon className="mr-1 h-3 w-auto stroke-current inline align-text-top" />
            <T id="interaction" />
          </>
        ) : (
          t('transactionOfSomeType', item.type)
        );
    }
  }, [item]);

  const { iconHash, iconType, argumentDisplayProps } = useMemo<{
    iconHash: string;
    iconType: 'bottts' | 'jdenticon';
    argumentDisplayProps?: OperationArgumentDisplayProps;
  }>(() => {
    const receivers = [
      ...new Set(
        item.expenses
          .map(({ to }) => to)
          .filter(value => (item.contractAddress ? value !== item.contractAddress : !!value))
      )
    ];

    switch (item.type) {
      case 'transaction':
      case 'transfer':
        return {
          iconHash: item.expenses[0]?.to || 'unknown',
          iconType: 'bottts',
          argumentDisplayProps: {
            i18nKey: 'transferToSmb',
            arg: receivers
          }
        };

      case 'approve':
        return {
          iconHash: item.expenses[0]?.to || 'unknown',
          iconType: 'jdenticon',
          argumentDisplayProps: {
            i18nKey: 'approveForSmb',
            arg: receivers
          }
        };

      case 'delegation':
        if (item.delegate) {
          return {
            iconHash: item.delegate,
            iconType: 'bottts',
            argumentDisplayProps: {
              i18nKey: 'delegationToSmb',
              arg: [item.delegate]
            }
          };
        }

        return {
          iconHash: 'none',
          iconType: 'jdenticon'
        };

      default:
        return item.isEntrypointInteraction
          ? {
              iconHash: item.contractAddress!,
              iconType: 'jdenticon',
              argumentDisplayProps: {
                i18nKey: 'interactionWithContract',
                arg: [item.contractAddress!]
              }
            }
          : {
              iconHash: 'unknown',
              iconType: 'jdenticon'
            };
    }
  }, [item]);

  const withdrawal = useMemo(() => ['transaction', 'transfer'].includes(item.type), [item.type]);

  return (
    <div className={classNames('pt-3 pb-2 px-2 flex items-stretch', !last && 'border-b border-gray-200')}>
      <div className="mr-2">
        <Identicon hash={iconHash} type={iconType} size={40} className="shadow-xs" />
      </div>

      <div className="flex-1 flex-col">
        <div className="mb-1 text-xs text-gray-500 font-light flex flex-wrap">
          <span className="mr-1 flex items-center text-blue-600 opacity-100">{operationTypeLabel}</span>

          {argumentDisplayProps && <OperationArgumentDisplay {...argumentDisplayProps} />}
        </div>

        <div className={classNames('flex items-end flex-shrink-0 flex-wrap', 'text-gray-800')}>
          {item.expenses
            .filter(expense => new BigNumber(expense.amount).isGreaterThan(0))
            .map((expense, index, arr) => (
              <span key={index}>
                <OperationVolumeDisplay
                  expense={expense}
                  volume={item.amount}
                  withdrawal={withdrawal}
                  mainnet={mainnet}
                />
                {index === arr.length - 1 ? null : ',\u00a0'}
              </span>
            ))}

          {item.expenses.length === 0 && item.amount && new BigNumber(item.amount).isGreaterThan(0) ? (
            <OperationVolumeDisplay volume={item.amount!} mainnet={mainnet} />
          ) : null}
        </div>
      </div>
    </div>
  );
};

type OperationArgumentDisplayProps = {
  i18nKey: TProps['id'];
  arg: string[];
};

const OperationArgumentDisplay = memo<OperationArgumentDisplayProps>(({ i18nKey, arg }) => (
  <T
    id={i18nKey}
    substitutions={
      <>
        {arg.map((value, index) => (
          <span key={index}>
            &nbsp;
            <HashChip className="text-blue-600 opacity-75" key={index} hash={value} type="link" />
            {index === arg.length - 1 ? null : ','}
          </span>
        ))}
      </>
    }
  />
));

type OperationVolumeDisplayProps = {
  expense?: OperationAssetExpense;
  volume?: number;
  withdrawal?: boolean;
  mainnet?: boolean;
};

const OperationVolumeDisplay = memo<OperationVolumeDisplayProps>(({ expense, volume, mainnet }) => {
  const metadata = useAssetMetadata(expense?.assetSlug ?? 'tez');

  const finalVolume = expense ? expense.amount.div(10 ** (metadata?.decimals || 0)) : volume;

  return (
    <>
      <span className="text-sm">
        {/* {withdrawal && "-"} */}
        <span className="font-medium">
          <Money>{finalVolume || 0}</Money>
        </span>{' '}
        {getAssetSymbol(metadata, true)}
      </span>

      {expense?.assetSlug && (
        <InUSD volume={finalVolume || 0} assetSlug={expense.assetSlug} mainnet={mainnet}>
          {usdVolume => (
            <div className="text-xs text-gray-500 ml-1">
              (<span className="mr-px">$</span>
              {usdVolume})
            </div>
          )}
        </InUSD>
      )}
    </>
  );
});
