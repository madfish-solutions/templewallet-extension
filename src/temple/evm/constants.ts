export const METHOD_NOT_SUPPORTED_ERROR_CODE = -32601;
export const INVALID_PARAMS_CODE = -32602;
export const INTERNAL_ERROR_CODE = -32603;
export const INVALID_INPUT_ERROR_CODE = -32000;

// Enum doesn't always work as expected in TypeScript
export const evmRpcMethodsNames = {
  eth_accounts: 'eth_accounts',
  eth_requestAccounts: 'eth_requestAccounts',
  wallet_switchEthereumChain: 'wallet_switchEthereumChain',
  eth_signTypedData: 'eth_signTypedData',
  eth_signTypedData_v1: 'eth_signTypedData_v1',
  eth_signTypedData_v3: 'eth_signTypedData_v3',
  eth_signTypedData_v4: 'eth_signTypedData_v4',
  personal_sign: 'personal_sign',
  wallet_getPermissions: 'wallet_getPermissions',
  wallet_requestPermissions: 'wallet_requestPermissions',
  wallet_revokePermissions: 'wallet_revokePermissions'
} as const;

export const RETURNED_ACCOUNTS_CAVEAT_NAME = 'restrictReturnedAccounts';

export const GET_DEFAULT_WEB3_PARAMS_METHOD_NAME = 'getDefaultRpc';
