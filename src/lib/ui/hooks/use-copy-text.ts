import { MouseEvent, useCallback } from 'react';

import { toastSuccess } from 'app/toaster';
import { t } from 'lib/i18n';

export const useCopyText = (text: string | null | undefined, stopPropagation = false, callback?: EmptyFn) => {
  return useCallback(
    (e?: MouseEvent) => {
      if (stopPropagation) {
        e?.preventDefault();
        e?.stopPropagation();
      }

      if (text == null) {
        return;
      }

      navigator.clipboard
        .writeText(text)
        .then(() => {
          callback?.();
          toastSuccess(t('copiedAddress'));
        })
        .catch(console.error);
    },
    [text, stopPropagation, callback]
  );
};
