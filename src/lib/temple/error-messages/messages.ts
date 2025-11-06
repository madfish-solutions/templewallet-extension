import { t } from 'lib/i18n';

/**
 * Configuration object mapping error patterns to human-readable messages
 */
export const ERROR_MESSAGES = {
  balance: t('lowBalanceError'),
  blockchainLoad: t('blockchainLoadError'),
  lowGasBalance: t('lowGasBalanceError'),
  feeTooLow: t('feeTooLowError'),
  gasLimitTooLow: t('gasLimitTooLowError'),
  storageLimitTooLow: t('storageLimitTooLowError'),
  notThisCycle: t('notThisCycleError'),
  invalidParams: t('invalidParamsError'),
  timeout: t('timeoutError'),
  fullySlashedDelegate: t('fullySlashedDelegateError'),
  unregisteredDelegate: t('unregisteredDelegateError'),
  delegateAlreadyActive: t('delegateAlreadyActiveError'),
  delegateUnchanged: t('delegateUnchangedError'),
  tmpForbiddenDelegate: t('tmpForbiddenDelegateError'),
  executionFailed: t('executionFailedError'),
  networkError: t('networkError'),
  nonceTooHigh: t('nonceTooHighError'),
  nonceTooLow: t('nonceTooLowError'),
  allowanceTooLow: t('allowanceTooLowError'),
  notApproved: t('notApprovedError'),
  default: t('unknownTxError'),
  unsafeAllowanceChange: t('unsafeAllowanceChangeError')
} as const;
