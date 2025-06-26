const LEDGER_ERROR_CODE_REGEX = /\((0x[0-9a-f]+)\)/i;
const LEDGER_APP_REJECTED_ERROR_CODE = 0x6985;
const LEDGER_LOCKED_ERROR_CODE = 0x5515;
const getLedgerErrorCode = (error: Error) => {
  const match = error.message.match(LEDGER_ERROR_CODE_REGEX);

  return match ? parseInt(match[1], 16) : null;
};

export const isLedgerRejectionError = (error: Error) => {
  const errorCode = getLedgerErrorCode(error);

  return [LEDGER_APP_REJECTED_ERROR_CODE, LEDGER_LOCKED_ERROR_CODE].some(
    couldNotConnectErrorCode => errorCode === couldNotConnectErrorCode
  );
};
