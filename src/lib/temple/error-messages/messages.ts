import { t } from 'lib/i18n';

/**
 * Configuration object mapping error patterns to human-readable messages
 */
export const ERROR_MESSAGES = {
  balance: t('lowBalanceError'),
  blockchainLoad: t('blockchainLoadError'),
  lowGasBalance: t('lowGasBalanceError'),
  gasExhausted: t('gasExhaustedError'),
  storageExhausted: t('storageExhaustedError'),
  feeTooLow: t('feeTooLowError'),
  notThisCycle: t('notThisCycleError'),
  invalidParams: t('invalidParamsError'),
  timeout: t('timeoutError'),
  fullySlashedDelegate: t('fullySlashedDelegateError'),
  unregisteredDelegate: t('unregisteredDelegateError'),
  delegateAlreadyActive: t('delegateAlreadyActiveError'),
  delegateEmpty: t('delegateEmptyError'),
  delegateUnchanged: t('delegateUnchangedError'),
  tmpForbiddenDelegate: t('tmpForbiddenDelegateError'),
  executionFailed: t('executionFailedError'),
  networkError: t('networkError'),
  nonceTooHigh: t('nonceTooHighError'),
  nonceTooLow: t('nonceTooLowError'),
  allowanceTooLow: t('allowanceTooLowError'),
  default: t('unknownTxError'),
  unsafeAllowanceChange: t('unsafeAllowanceChangeError')
} as const;
