import { AlchemyRpcError, getAlchemyCallsStatus, sendAlchemyCalls } from 'lib/apis/temple/endpoints/evm/alchemy-wallet';

import type { AlchemySubmission, AlchemySubmissionAttempt } from './submission';

export const getAlchemyCheckDelay = (checks: number): number => Math.min(60_000, 3_000 * 2 ** Math.min(checks, 5));

const isInitialRejection = (cause: unknown): boolean =>
  cause instanceof AlchemyRpcError &&
  (cause.code === -32602 ||
    /precheck failed|invalid account signature|authorization signature is invalid|execution reverted|AA2[134]|AA3\d/i.test(
      cause.message
    )) &&
  !/unavailable|rate limit|already known|nonce|replacement/i.test(cause.message);

/** The caller serializes access to the account record. Save before every network submission. */
export async function reconcileAlchemySubmission(
  record: AlchemySubmission,
  save: (record: AlchemySubmission) => Promise<void>,
  force = false
): Promise<AlchemySubmission> {
  if (record.result) return record;
  const current: AlchemySubmission = {
    ...record,
    attempts: record.attempts.map(attempt => ({ ...attempt }))
  };
  let checked = false;
  for (const attempt of current.attempts) {
    if (attempt.state === 'failed' || (!force && attempt.nextCheckAt > Date.now())) continue;
    if (!checked) current.error = undefined;
    checked = true;
    const firstSend = attempt.state === 'queued';
    try {
      if (!firstSend) {
        const status = await getAlchemyCallsStatus(attempt.id).catch(cause => {
          if (
            attempt.state === 'unknown' &&
            cause instanceof AlchemyRpcError &&
            /not found|unknown call/i.test(cause.message)
          )
            return {
              id: attempt.id,
              chainId: current.quote.request.chainId,
              atomic: true,
              status: 400,
              receipts: undefined
            };
          throw cause;
        });
        if (
          BigInt(status.chainId) !== BigInt(current.quote.request.chainId) ||
          status.id.toLowerCase() !== attempt.id.toLowerCase()
        )
          throw new Error('Alchemy status identity mismatch');
        if (status.status === 200) {
          const receipt = status.receipts?.[0];
          if (!status.atomic || receipt?.status !== '0x1' || !receipt.transactionHash)
            throw new Error('Alchemy returned an invalid batch receipt');
          current.result = { status: 'confirmed', transactionHash: receipt.transactionHash };
          await save(current);
          return current;
        }
        if (status.status === 500 || (status.status === 400 && attempt.state === 'pending')) {
          attempt.state = 'failed';
          continue;
        }
        // A pending lookup alone does not prove that the service accepted the signature.
        if (!(status.status >= 100 && status.status < 200) && status.status !== 400) {
          throw new Error('Alchemy returned a partial or unknown batch status. Retry the status check.');
        }
      }
      if (firstSend || attempt.state === 'unknown') {
        // A restart or lost response makes later rejections ambiguous, including AA25.
        attempt.state = 'unknown';
        await save(current);
        try {
          const { id } = await sendAlchemyCalls(attempt.signed);
          if (id.toLowerCase() !== attempt.id.toLowerCase()) throw new Error('Alchemy submission identity mismatch');
          attempt.state = 'pending';
        } catch (cause) {
          if (firstSend && isInitialRejection(cause)) attempt.state = 'failed';
          throw cause;
        }
      }
    } catch (cause) {
      current.error = {
        message: cause instanceof Error ? cause.message : 'Alchemy status unavailable. Retry later.',
        ...(cause instanceof AlchemyRpcError ? { code: cause.code, data: cause.data } : {})
      };
    } finally {
      scheduleAttempt(attempt);
    }
  }
  if (current.attempts.every(attempt => attempt.state === 'failed')) current.result = { status: 'failed' };
  if (!checked && !current.result) return record;
  await save(current);
  return current;
}

function scheduleAttempt(attempt: AlchemySubmissionAttempt): void {
  attempt.nextCheckAt = Date.now() + getAlchemyCheckDelay(attempt.checks++);
}
