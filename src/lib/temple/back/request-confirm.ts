import { identity } from 'lodash';
import browser, { Runtime } from 'webextension-polyfill';

import { IS_GOOGLE_CHROME_BROWSER } from 'lib/env';
import { TempleDAppPayload, TempleMessageType, TempleRequest } from 'lib/temple/types';

import { intercom } from './defaults';
import { sidebarClosed, store } from './store';

export interface RequestConfirmParams<T extends TempleDAppPayload> {
  id: string;
  payload: T;
  onDecline: () => void;
  transformPayload?: (payload: T) => Promise<T>;
  handleIntercomRequest: (req: TempleRequest, decline: () => void) => Promise<any>;
}

const CONFIRM_WINDOW_WIDTH = 384;
const CONFIRM_WINDOW_HEIGHT = 600;
const AUTODECLINE_AFTER = 120_000;

export async function requestConfirm<T extends TempleDAppPayload>({
  id,
  payload,
  onDecline,
  transformPayload = identity,
  handleIntercomRequest
}: RequestConfirmParams<T>) {
  let closing = false;
  let stopViewClosedListening: EmptyFn | undefined;
  let closeView: (() => Promise<void>) | undefined;
  const close = async () => {
    if (closing) return;
    closing = true;

    try {
      stopTimeout();
      stopRequestListening();
      stopViewClosedListening?.();

      await closeView?.();
    } catch (_err) {}
  };

  const declineAndClose = () => {
    onDecline();
    close();
  };

  let knownPort: Runtime.Port | undefined;
  const stopRequestListening = intercom.onRequest(async (req: TempleRequest, port) => {
    if (req?.type === TempleMessageType.DAppGetPayloadRequest && req.id === id) {
      knownPort = port;

      return {
        type: TempleMessageType.DAppGetPayloadResponse,
        payload: await transformPayload(payload)
      };
    } else {
      if (knownPort !== port) return;

      const result = await handleIntercomRequest(req, onDecline);
      if (result) {
        close();
        return result;
      }
    }
  });

  const openedSidebarWindows = store.getState().windowsWithSidebars.filter(Boolean) as number[];

  const sidePanelBehaviorEnabled =
    IS_GOOGLE_CHROME_BROWSER &&
    Boolean(chrome?.sidePanel) &&
    (await chrome.sidePanel.getPanelBehavior()).openPanelOnActionClick;

  const shouldUseSidePanel =
    IS_GOOGLE_CHROME_BROWSER &&
    Boolean(chrome?.sidePanel) &&
    (openedSidebarWindows.length > 0 || sidePanelBehaviorEnabled);

  if (shouldUseSidePanel) {
    const targetWindowId =
      openedSidebarWindows[openedSidebarWindows.length - 1] ??
      (await browser.windows.getLastFocused().then(window => window.id));

    await chrome.sidePanel.setOptions({ path: browser.runtime.getURL(`sidebar.html#?id=${id}`) });

    if (targetWindowId !== undefined) {
      await chrome.sidePanel.open({ windowId: targetWindowId });
    }

    const sub = store.watch(sidebarClosed, (_, closedSidebarWindowId) => {
      if (closedSidebarWindowId === (targetWindowId ?? null)) {
        declineAndClose();
      }
    });
    stopViewClosedListening = () => sub.unsubscribe();
    closeView = () => chrome.sidePanel.setOptions({ path: browser.runtime.getURL('sidebar.html') });
  } else {
    const confirmWin = await createConfirmationWindow(id);

    closeView = async () => {
      if (confirmWin.id) {
        const win = await browser.windows.get(confirmWin.id);
        if (win.id) {
          await browser.windows.remove(win.id);
        }
      }
    };

    const handleWinRemoved = (winId: number) => {
      if (winId === confirmWin?.id) {
        declineAndClose();
      }
    };
    browser.windows.onRemoved.addListener(handleWinRemoved);
    stopViewClosedListening = () => browser.windows.onRemoved.removeListener(handleWinRemoved);
  }

  // Decline after timeout
  const t = setTimeout(declineAndClose, AUTODECLINE_AFTER);
  const stopTimeout = () => clearTimeout(t);
}

async function createConfirmationWindow(confirmationId: string) {
  const isWin = (await browser.runtime.getPlatformInfo()).os === 'win';

  const height = isWin ? CONFIRM_WINDOW_HEIGHT + 17 : CONFIRM_WINDOW_HEIGHT;
  const width = isWin ? CONFIRM_WINDOW_WIDTH + 16 : CONFIRM_WINDOW_WIDTH;

  const [top, left] = (await getTopRightPositionForWindow(width)) || [];

  const options: browser.Windows.CreateCreateDataType = {
    type: 'popup',
    url: browser.runtime.getURL(`confirm.html#?id=${confirmationId}`),
    width,
    height
  };

  try {
    /* Trying, because must have 50% of window in a viewport. Otherwise, error thrown. */
    const confirmWin = await browser.windows.create({ ...options, top, left });

    // Firefox currently ignores left/top for create, but it works for update
    if (left != null && confirmWin.id && confirmWin.state !== 'fullscreen' && confirmWin.left !== left)
      await browser.windows.update(confirmWin.id, { left, top }).catch(() => void 0);

    return confirmWin;
  } catch {
    return await browser.windows.create(options);
  }
}

/** Position window within the top right edge of lastFocused window */
async function getTopRightPositionForWindow(width: number): Promise<[number, number] | undefined> {
  const lastFocused = await browser.windows.getLastFocused().catch(() => void 0);

  if (lastFocused == null || lastFocused.width == null) return;

  const top = Math.round(lastFocused.top!);
  const left = Math.round(lastFocused.left! + lastFocused.width! - width);

  return [top, left];
}
