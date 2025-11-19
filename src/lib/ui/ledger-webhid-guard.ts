import { useCallback, useMemo, useRef, useState } from 'react';

import { openInFullPage, openInFullConfirmPage, useAppEnv } from 'app/env';
import { LEDGER_USB_VENDOR_ID } from 'lib/constants';
import { getLedgerTransportType } from 'lib/ledger/helpers';
import { TransportType } from 'lib/ledger/transport/types';
import { TempleAccountType } from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

import { LedgerFullViewPromptModalProps } from './LedgerFullViewPrompt';

export const LEDGER_WEBHID_PENDING_PREFIX = 'tw-ledger-webhid-pending';

interface PersistOptions<T> {
  key: string;
  data: T;
}

interface LedgerWebHidGuardOptions<T> {
  persist?: PersistOptions<T>;
  onBeforeFullView?: () => Promise<void> | void;
}

export function useLedgerWebHidFullViewGuard() {
  const { popup, sidebar, confirmWindow, fullPage } = useAppEnv();

  const [promptOpened, setPromptOpened] = useState(false);

  const promptResolverRef = useRef<SyncFn<boolean>>();

  const showPrompt = useCallback(
    () =>
      new Promise<boolean>(resolve => {
        promptResolverRef.current = resolve;
        setPromptOpened(true);
      }),
    []
  );

  const handlePromptClose = useCallback(() => {
    setPromptOpened(false);
    promptResolverRef.current?.(false);
    promptResolverRef.current = undefined;
  }, []);

  const handlePromptProceed = useCallback(() => {
    setPromptOpened(false);
    promptResolverRef.current?.(true);
    promptResolverRef.current = undefined;
  }, []);

  const ledgerPromptProps = useMemo<LedgerFullViewPromptModalProps>(
    () => ({
      opened: promptOpened,
      onClose: handlePromptClose,
      onProceed: handlePromptProceed
    }),
    [handlePromptClose, handlePromptProceed, promptOpened]
  );

  const guard = useCallback(
    async <T>(accountType: TempleAccountType, options?: LedgerWebHidGuardOptions<T>): Promise<boolean> => {
      const { persist, onBeforeFullView } = options ?? {};
      try {
        const isLedgerAccount = accountType === TempleAccountType.Ledger;
        if (!isLedgerAccount) return false;

        const transportType = getLedgerTransportType();
        const inConstrainedView = popup || sidebar || (confirmWindow && !fullPage);
        const hidAvailable = Boolean(globalThis?.navigator?.hid);

        if (transportType !== TransportType.WEBHID || !inConstrainedView || !hidAvailable) {
          return false;
        }

        const devices = await globalThis.navigator.hid.getDevices();
        if (devices && devices.length > 0) {
          return false;
        }

        const proceed = await showPrompt();

        if (!proceed) {
          return true;
        }

        if (persist) {
          try {
            localStorage.setItem(persist.key, JSON.stringify(persist.data));
          } catch {}
        }

        await onBeforeFullView?.();

        if (confirmWindow) {
          openInFullConfirmPage();
          if (onBeforeFullView) {
            window.close();
          }
        } else {
          openInFullPage();
          window.close();
        }
        return true;
      } catch {
        return false;
      }
    },
    [popup, sidebar, confirmWindow, fullPage, showPrompt]
  );

  const readPending = useCallback(<T>(key: string): T | null => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }, []);

  const clearPending = useCallback((key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  }, []);

  const preconnectIfNeeded = useCallback(async (accountType: TempleAccountType, chainKind?: TempleChainKind) => {
    try {
      const isLedgerAccount = accountType === TempleAccountType.Ledger;
      if (!isLedgerAccount) return;
      if (chainKind && chainKind !== TempleChainKind.EVM) return;

      const transportType = getLedgerTransportType();
      const hid = globalThis?.navigator?.hid;
      if (transportType !== TransportType.WEBHID || !hid) return;

      const devices = await hid.getDevices();
      if (devices && devices.length > 0) return;

      await hid.requestDevice({
        filters: [{ vendorId: Number(LEDGER_USB_VENDOR_ID) }]
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  return { guard, readPending, clearPending, preconnectIfNeeded, ledgerPromptProps };
}
