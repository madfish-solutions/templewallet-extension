import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { Button } from 'app/atoms';
import { useBooleanState } from 'lib/ui/hooks';
import { dispatch } from 'app/store';
import { addCrossChainExchangeAction, removeCrossChainExchangeAction } from 'app/store/cross-chain-send/actions';
import { CrossChainExchange, CrossChainPhase } from 'app/store/cross-chain-send/state';
import { CROSS_CHAIN_ASSETS, CrossChainAsset } from 'lib/cross-chain';
import { useAccount } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { ConfirmCrossChainSendModal } from '../modals/ConfirmCrossChainSend';
import { ConfirmCrossChainStep } from '../modals/ConfirmCrossChainSend/types';
import { CrossChainActivityModal } from '../modals/CrossChainActivityModal';

const SEED_PREFIX = 'dev-seed-';

const PREVIEW_DATA = {
  fromAsset: CROSS_CHAIN_ASSETS.TEZOS_USDT,
  toAsset: CROSS_CHAIN_ASSETS.ETH_USDT,
  fromAmount: '345',
  toAmountEstimated: '345',
  recipient: '0x1a6b34a7Cb1f2dC5b6E9F4a8B7c2D9E3a5F73963'
};

const buildFakeExchange = (
  phase: CrossChainPhase,
  accountId: string,
  overrides: Partial<CrossChainExchange> = {}
): CrossChainExchange => ({
  id: `${SEED_PREFIX}${phase.toLowerCase()}-${accountId.slice(0, 6)}`,
  accountId,
  sourceChainKind: TempleChainKind.Tezos,
  sourceChainId: 'NetXdQprcVkpaWU',
  senderAddress: 'tz1L7QrPFCSXM4ckPzGqQp9j7iBg9z3uM2Z9',
  sourceTxHash: 'oo1q2w3e4r5t6y7u8i9o0p1a2s3d4f5g6h7j8k9l0z',
  depositAddress: 'tz1depositXXXXXXXXXXXXXXXXXXXXXXXXXX',
  recipient: PREVIEW_DATA.recipient,
  fromAsset: PREVIEW_DATA.fromAsset,
  toAsset: PREVIEW_DATA.toAsset,
  fromAmount: PREVIEW_DATA.fromAmount,
  toAmountEstimated: PREVIEW_DATA.toAmountEstimated,
  toAmountActual: phase === 'COMPLETED' ? '344.12' : undefined,
  phase,
  exolixStatus: phase.toLowerCase(),
  hashIn: { hash: '0xe1Bb4d4Ad9b5559aBcDeF0123456789012345678ABCDEF0123456789ABCDef2728', link: null },
  hashOut: phase === 'COMPLETED'
    ? { hash: '0xabc1234567890def1234567890abcdef1234567890abcdef1234567890abcd', link: null }
    : undefined,
  createdAt: Date.now() - 1000 * 60 * 60,
  updatedAt: Date.now(),
  completedAt: phase === 'COMPLETED' ? Date.now() : undefined,
  ...overrides
});

interface DevPhaseEntry {
  key: string;
  phase: CrossChainPhase;
  step: ConfirmCrossChainStep;
  label: string;
  exolixStatus?: string;
  refundHash?: string;
}

const PHASES_FOR_DEV: DevPhaseEntry[] = [
  { key: 'pending-tx', phase: 'PENDING_TX', step: ConfirmCrossChainStep.Processing, label: 'Processing — Confirmation' },
  { key: 'tx-confirmed', phase: 'TX_CONFIRMED', step: ConfirmCrossChainStep.Processing, label: 'Processing — Exchange' },
  { key: 'exchanging', phase: 'EXCHANGING', step: ConfirmCrossChainStep.Processing, label: 'Processing — Sending' },
  { key: 'completed', phase: 'COMPLETED', step: ConfirmCrossChainStep.Completed, label: 'Completed' },
  { key: 'failed', phase: 'FAILED', step: ConfirmCrossChainStep.Failed, label: 'Failed' },
  { key: 'overdue', phase: 'FAILED', step: ConfirmCrossChainStep.Failed, label: 'Overdue', exolixStatus: 'overdue' },
  {
    key: 'refunded',
    phase: 'FAILED',
    step: ConfirmCrossChainStep.Failed,
    label: 'Refunded',
    exolixStatus: 'refunded',
    refundHash: '0xrefund1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
  }
];

const SEED_ASSETS: { from: CrossChainAsset; to: CrossChainAsset }[] = [
  { from: CROSS_CHAIN_ASSETS.TEZOS_USDT, to: CROSS_CHAIN_ASSETS.ETH_USDT },
  { from: CROSS_CHAIN_ASSETS.ETH_USDT, to: CROSS_CHAIN_ASSETS.TEZOS_USDT },
  { from: CROSS_CHAIN_ASSETS.TEZOS_USDT, to: CROSS_CHAIN_ASSETS.BTC }
];

export const CrossChainDevPanel: FC = memo(() => {
  const account = useAccount();
  const accountId = account?.id ?? 'dev';

  const [confirmOpen, openConfirm, closeConfirm] = useBooleanState(false);
  const [activityOpen, openActivity, closeActivity] = useBooleanState(false);
  const [previewOpen, openPreview, closePreview] = useBooleanState(false);
  const [previewFailureOpen, openPreviewFailure, closePreviewFailure] = useBooleanState(false);
  const [activeExchangeId, setActiveExchangeId] = useState<string>();
  const [activeStep, setActiveStep] = useState<ConfirmCrossChainStep>(ConfirmCrossChainStep.Processing);

  const seedAll = useCallback(() => {
    PHASES_FOR_DEV.forEach((p, i) => {
      const assets = SEED_ASSETS[i % SEED_ASSETS.length];
      dispatch(
        addCrossChainExchangeAction(
          buildFakeExchange(p.phase, accountId, {
            id: `${SEED_PREFIX}${p.key}-${i}`,
            fromAsset: assets.from,
            toAsset: assets.to,
            exolixStatus: p.exolixStatus ?? p.phase.toLowerCase(),
            refundHash: p.refundHash,
            createdAt: Date.now() - 1000 * 60 * 60 * (i + 1)
          })
        )
      );
    });
  }, [accountId]);

  const clearAll = useCallback(() => {
    PHASES_FOR_DEV.forEach((p, i) => {
      dispatch(removeCrossChainExchangeAction(`${SEED_PREFIX}${p.key}-${i}`));
    });
  }, []);

  const openAtPhase = useCallback(
    (entry: DevPhaseEntry) => {
      const ex = buildFakeExchange(entry.phase, accountId, {
        id: `${SEED_PREFIX}${entry.key}-preview`,
        exolixStatus: entry.exolixStatus ?? entry.phase.toLowerCase(),
        refundHash: entry.refundHash
      });
      dispatch(addCrossChainExchangeAction(ex));
      setActiveExchangeId(ex.id);
      setActiveStep(entry.step);
      openConfirm();
    },
    [accountId, openConfirm]
  );

  const handleCloseConfirm = useCallback(() => {
    if (activeExchangeId) dispatch(removeCrossChainExchangeAction(activeExchangeId));
    setActiveExchangeId(undefined);
    closeConfirm();
  }, [activeExchangeId, closeConfirm]);

  const reviewData = useMemo(() => PREVIEW_DATA, []);

  return (
    <div className="m-4 p-3 rounded-8 border border-dashed border-primary bg-primary-low/30 flex flex-col gap-y-2">
      <p className="text-font-description-bold text-primary">Cross-chain dev preview</p>
      <p className="text-font-small text-grey-1">Visible only in dev builds. Seeds fake exchanges and opens screens.</p>

      <div className="grid grid-cols-2 gap-2">
        <DevButton onClick={openPreview}>Open: Preview</DevButton>
        <DevButton onClick={openPreviewFailure}>Open: Preview (reservation fail)</DevButton>
        {PHASES_FOR_DEV.map(p => (
          <DevButton key={p.key} onClick={() => openAtPhase(p)}>
            {p.label}
          </DevButton>
        ))}
        <DevButton onClick={openActivity}>Open: Activity list</DevButton>
        <DevButton onClick={seedAll}>Seed activity entries</DevButton>
        <DevButton onClick={clearAll}>Clear seeded entries</DevButton>
      </div>

      <ConfirmCrossChainSendModal
        opened={confirmOpen}
        onRequestClose={handleCloseConfirm}
        initialStep={activeStep}
        initialExchangeId={activeExchangeId}
        reviewData={reviewData}
        onTryAgain={() => undefined}
      />

      <ConfirmCrossChainSendModal
        opened={previewOpen}
        onRequestClose={closePreview}
        reviewData={reviewData}
      />

      <ConfirmCrossChainSendModal
        opened={previewFailureOpen}
        onRequestClose={closePreviewFailure}
        reviewData={reviewData}
        devForceReservationError
      />

      <CrossChainActivityModal
        opened={activityOpen}
        onRequestClose={closeActivity}
        accountId={accountId}
        onExchangeClick={ex => {
          setActiveExchangeId(ex.id);
          setActiveStep(
            ex.phase === 'COMPLETED'
              ? ConfirmCrossChainStep.Completed
              : ex.phase === 'FAILED'
                ? ConfirmCrossChainStep.Failed
                : ConfirmCrossChainStep.Processing
          );
          closeActivity();
          openConfirm();
        }}
      />
    </div>
  );
});

const DevButton: FC<React.PropsWithChildren<{ onClick: EmptyFn }>> = ({ children, onClick }) => (
  <Button
    onClick={onClick}
    className="text-font-small-bold bg-white border-0.5 border-primary text-primary rounded-6 px-2 py-1 hover:bg-primary-low transition-colors"
  >
    {children}
  </Button>
);
