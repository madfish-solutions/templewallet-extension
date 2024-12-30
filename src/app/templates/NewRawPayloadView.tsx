import React, { memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';
import ReactJson from 'react-json-view';

import { TextButton } from 'app/atoms/TextButton';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { toastSuccess } from 'app/toaster';
import { T, t } from 'lib/i18n';
import { TempleEvmDAppSignPayload } from 'lib/temple/types';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

interface NewRawPayloadViewProps {
  payload: TempleEvmDAppSignPayload['payload'];
}

export const NewRawPayloadView = memo<NewRawPayloadViewProps>(({ payload }) => {
  const { fieldRef, copy } = useCopyToClipboard<HTMLTextAreaElement>();

  const text = useMemo(() => (typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)), [payload]);

  const handleCopyPress = useCallback(() => {
    copy();
    toastSuccess(t('copiedHash'));
  }, [copy]);

  return (
    <div className="rounded-lg p-4 bg-white shadow-bottom flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <span className="flex-1 text-font-description-bold text-grey-2">
          <T id="message" />
        </span>

        <TextButton color="blue" Icon={CopyIcon} onClick={handleCopyPress}>
          <T id="copy" />
        </TextButton>

        <textarea ref={fieldRef} value={text} readOnly className="sr-only" />
      </div>

      <div className={clsx('max-h-44 overflow-auto', typeof payload !== 'string' && 'bg-input-low rounded-lg p-3')}>
        {typeof payload === 'string' ? (
          <span className="text-font-medium">{payload}</span>
        ) : (
          <ReactJson
            src={payload}
            name={null}
            iconStyle="square"
            indentWidth={2}
            collapsed={3}
            collapseStringsAfterLength={36}
            enableClipboard={false}
            displayObjectSize={false}
            displayDataTypes={false}
          />
        )}
      </div>
    </div>
  );
});
