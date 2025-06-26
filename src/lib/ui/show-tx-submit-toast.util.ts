import { CLOSE_ANIMATION_TIMEOUT } from 'app/atoms/PageModal';
import { toastSuccess } from 'app/toaster';
import { t } from 'lib/i18n';
import { makeBlockExplorerHref } from 'temple/front/use-block-explorers';
import { TempleChainKind } from 'temple/types';

export const showTxSubmitToastWithDelay = (
  chainKind: TempleChainKind,
  hash: string,
  explorerBaseUrl?: string,
  text = t('transactionSubmitted')
) =>
  void setTimeout(
    () =>
      toastSuccess(
        text,
        true,
        explorerBaseUrl
          ? { hash, blockExplorerHref: makeBlockExplorerHref(explorerBaseUrl, hash, 'tx', chainKind) }
          : undefined
      ),
    CLOSE_ANIMATION_TIMEOUT * 2
  );
