import { IntercomError } from 'lib/intercom/helpers';

import { ERROR_MESSAGES } from './messages';
import {
  cannotAffordGas,
  gasTokenAmountGtBalance,
  gasTokenAmountGtBalance2,
  gasTokenAmountGtBalanceLegacy,
  txUnderpriceError,
  unknownExecutionError,
  insufficientFundsOnSubmitError,
  erc20AmountExceedsBalanceError,
  erc20AmountExceedsOthersBalanceError,
  erc20TransferZeroAddressDestinationError,
  erc20ApproveZeroAddressDestinationError,
  erc20InsufficientAllowanceError,
  erc721TransferToZeroAddressError,
  erc721ApproveToCurrentOwnerError,
  erc721InvalidTokenIdError,
  erc1155InvalidReceiverError,
  erc1155InvalidArrayLengthError,
  erc1155InvalidOperatorError,
  erc1155InsufficientBalanceError,
  requestFailedError as requestFailedErrorEvm,
  erc1155MissingApprovalForAllError
} from './mocks/serialized-evm-errors.json';
import {
  transferFromEmptyAccountError,
  cannotPayStorageFeeError,
  gasBalanceTooLowError,
  kusdInsufficientBalanceError,
  tzbtcInsufficientBalanceError,
  plentyInsufficientBalanceError,
  sirsInsufficientBalanceError,
  testFa12InsufficientBalanceError,
  testFa12OtherAccountInsufficientBalanceError,
  otherContractTransfer23CodeError,
  kusdApproveUnsafeAllowanceChangeError,
  tzbtcApproveUnsafeAllowanceChangeError,
  plentyUnsafeAllowanceChangeError,
  sirsUnsafeAllowanceChangeError,
  testFa12UnsafeAllowanceChangeError,
  otherContractApprove23CodeError,
  kusdNotEnoughAllowanceError,
  tzbtcNotEnoughAllowanceError,
  plentyNotEnoughAllowanceError,
  sirsNotEnoughAllowanceError,
  fa2ApproveUndefinedTokenError,
  fa2TransferUndefinedTokenError,
  fa2DirectTransferInsufficientBalanceError,
  fa2MixedTransfersInsufficientBalanceError,
  fa2MixedTransfersInsufficientBalanceError2,
  emptyImplicitDelegatedContractError,
  fa2NotApprovedTransferError
} from './mocks/serialized-tez-errors.json';

import { getHumanErrorMessage } from './index';

describe('getHumanErrorMessage', () => {
  describe('EVM dApps operations', () => {
    it('should return the message about low gas balance when the ETH balance is too low to pay for gas', () => {
      expect(getHumanErrorMessage(cannotAffordGas)).toBe(ERROR_MESSAGES.lowGasBalance);
      expect(getHumanErrorMessage(insufficientFundsOnSubmitError)).toBe(ERROR_MESSAGES.lowGasBalance);
    });

    it('should return the message about low gas balance when trying to send more ETH than the balance', () => {
      expect(getHumanErrorMessage(gasTokenAmountGtBalance)).toBe(ERROR_MESSAGES.lowGasBalance);
      expect(getHumanErrorMessage(gasTokenAmountGtBalance2)).toBe(ERROR_MESSAGES.lowGasBalance);
      expect(getHumanErrorMessage(gasTokenAmountGtBalanceLegacy)).toBe(ERROR_MESSAGES.lowGasBalance);
    });

    it('should return the message about execution failure when the transaction fails for an unknown reason', () => {
      expect(getHumanErrorMessage(unknownExecutionError)).toBe(ERROR_MESSAGES.executionFailed);
    });

    it('should return the message about fee too low when the transaction is underpriced', () => {
      expect(getHumanErrorMessage(txUnderpriceError)).toBe(ERROR_MESSAGES.feeTooLow);
    });

    describe('ERC20 errors', () => {
      it('should return the message about invalid parameters when the transfer destination is the zero address', () => {
        expect(getHumanErrorMessage(erc20TransferZeroAddressDestinationError)).toBe(ERROR_MESSAGES.invalidParams);
      });

      it('should return the message about invalid parameters when the approval destination is the zero address', () => {
        expect(getHumanErrorMessage(erc20ApproveZeroAddressDestinationError)).toBe(ERROR_MESSAGES.invalidParams);
      });

      it("should return the message about low balance when trying to send more sender's ERC20 tokens than its balance", () => {
        expect(getHumanErrorMessage(erc20AmountExceedsBalanceError)).toBe(ERROR_MESSAGES.balance);
      });

      it('should return the message about execution failure when trying to transfer more ERC20 tokens from an approved address than it has', () => {
        expect(getHumanErrorMessage(erc20AmountExceedsOthersBalanceError)).toBe(ERROR_MESSAGES.executionFailed);
      });

      it('should return the message about too low allowance when trying to send more ERC20 tokens than the allowance', () => {
        expect(getHumanErrorMessage(erc20InsufficientAllowanceError)).toBe(ERROR_MESSAGES.allowanceTooLow);
      });
    });

    describe('ERC721 errors', () => {
      it('should return the message about invalid parameters when the transfer destination is the zero address', () => {
        expect(getHumanErrorMessage(erc721TransferToZeroAddressError)).toBe(ERROR_MESSAGES.invalidParams);
      });

      it('should return the message about invalid parameters when the approval destination is the current owner', () => {
        expect(getHumanErrorMessage(erc721ApproveToCurrentOwnerError)).toBe(ERROR_MESSAGES.invalidParams);
      });

      it('should return the message about invalid parameters when the token ID is invalid', () => {
        expect(getHumanErrorMessage(erc721InvalidTokenIdError)).toBe(ERROR_MESSAGES.invalidParams);
      });
    });

    describe('ERC1155 errors', () => {
      it('should return the message about invalid parameters when ERC1155InvalidReceiver error is thrown', () => {
        expect(getHumanErrorMessage(erc1155InvalidReceiverError)).toBe(ERROR_MESSAGES.invalidParams);
      });

      it('should return the message about invalid parameters when ERC1155InvalidArrayLength error is thrown', () => {
        expect(getHumanErrorMessage(erc1155InvalidArrayLengthError)).toBe(ERROR_MESSAGES.invalidParams);
      });

      it('should return the message about invalid parameters when ERC1155InvalidOperator error is thrown', () => {
        expect(getHumanErrorMessage(erc1155InvalidOperatorError)).toBe(ERROR_MESSAGES.invalidParams);
      });

      it('should return the message about insufficient balance when ERC1155InsufficientBalance error is thrown', () => {
        expect(getHumanErrorMessage(erc1155InsufficientBalanceError)).toBe(ERROR_MESSAGES.balance);
      });

      it('should return the message with a piece of advice to approve all necessary tokens when trying to spend not approved tokens', () => {
        expect(getHumanErrorMessage(erc1155MissingApprovalForAllError)).toBe(ERROR_MESSAGES.notApproved);
      });
    });
  });

  it('should return the message about EVM network error if it is wrapped in IntercomError', () => {
    expect(getHumanErrorMessage(new IntercomError('test', [requestFailedErrorEvm]))).toBe(ERROR_MESSAGES.networkError);
  });

  describe('Tezos dApps operations', () => {
    it('should return the message about low gas balance when the Tezos balance is too low to pay for gas + storage fee + amount', () => {
      expect(
        [
          gasBalanceTooLowError,
          cannotPayStorageFeeError,
          transferFromEmptyAccountError,
          emptyImplicitDelegatedContractError
        ].map(error => getHumanErrorMessage(error))
      ).toEqual(Array(4).fill(ERROR_MESSAGES.lowGasBalance));
    });

    describe('FA1.2 tokens operations', () => {
      describe('transfer', () => {
        it('should return the message about low balance when trying to send more FA1.2 tokens than the balance', () => {
          expect(
            [
              kusdInsufficientBalanceError,
              tzbtcInsufficientBalanceError,
              plentyInsufficientBalanceError,
              sirsInsufficientBalanceError,
              testFa12InsufficientBalanceError
            ].map(error => getHumanErrorMessage(error))
          ).toEqual(Array(5).fill(ERROR_MESSAGES.balance));
        });

        it('should return the message about execution failure if an error is caused by insufficient balance of another account', () => {
          expect(getHumanErrorMessage(testFa12OtherAccountInsufficientBalanceError)).toBe(
            ERROR_MESSAGES.executionFailed
          );
        });

        it('should return the message about execution failure when "23" error is thrown not by kUSD contract', () => {
          expect(getHumanErrorMessage(otherContractTransfer23CodeError)).toBe(ERROR_MESSAGES.executionFailed);
        });

        it('should return the message about too low allowance when trying to send more FA1.2 tokens than the allowance', () => {
          expect(
            [
              kusdNotEnoughAllowanceError,
              tzbtcNotEnoughAllowanceError,
              plentyNotEnoughAllowanceError,
              sirsNotEnoughAllowanceError
            ].map(error => getHumanErrorMessage(error))
          ).toEqual(Array(4).fill(ERROR_MESSAGES.allowanceTooLow));
        });
      });

      describe('approve', () => {
        it('should return the message about unsafe allowance change when trying to change non-zero allowance immediately', () => {
          expect(
            [
              kusdApproveUnsafeAllowanceChangeError,
              tzbtcApproveUnsafeAllowanceChangeError,
              plentyUnsafeAllowanceChangeError,
              sirsUnsafeAllowanceChangeError,
              testFa12UnsafeAllowanceChangeError
            ].map(error => getHumanErrorMessage(error))
          ).toEqual(Array(5).fill(ERROR_MESSAGES.unsafeAllowanceChange));
        });

        it('should return the message about execution failure when "23" error is thrown not by kUSD contract', () => {
          expect(getHumanErrorMessage(otherContractApprove23CodeError)).toBe(ERROR_MESSAGES.executionFailed);
        });
      });
    });

    describe('FA2 tokens operations', () => {
      describe('transfer', () => {
        it('should return the message about invalid parameters when trying to send an undefined token', () => {
          expect(getHumanErrorMessage(fa2TransferUndefinedTokenError)).toBe(ERROR_MESSAGES.invalidParams);
        });

        it('should return the message about low balance when trying to send more FA2 tokens than the balance', () => {
          expect(getHumanErrorMessage(fa2DirectTransferInsufficientBalanceError)).toBe(ERROR_MESSAGES.balance);
        });

        it('should return the message with a piece of advice to approve all necessary tokens when trying to spend not approved tokens', () => {
          expect(getHumanErrorMessage(fa2NotApprovedTransferError)).toBe(ERROR_MESSAGES.notApproved);
        });

        it('should return the message about execution failure when at least one of transfers is not from the initiator', () => {
          expect(getHumanErrorMessage(fa2MixedTransfersInsufficientBalanceError)).toBe(ERROR_MESSAGES.executionFailed);
          expect(getHumanErrorMessage(fa2MixedTransfersInsufficientBalanceError2)).toBe(ERROR_MESSAGES.executionFailed);
        });
      });

      describe('update_operators', () => {
        it('should return the message about invalid parameters when trying to approve an undefined token', () => {
          expect(getHumanErrorMessage(fa2ApproveUndefinedTokenError)).toBe(ERROR_MESSAGES.invalidParams);
        });
      });
    });
  });

  it('should return appropriate message for IntercomError for Tezos operations', () => {
    expect(
      getHumanErrorMessage(
        new IntercomError('(temporary) proto.023-PtSeouLo.tez.subtraction_underflow', cannotPayStorageFeeError.error)
      )
    ).toBe(ERROR_MESSAGES.lowGasBalance);
  });
});
