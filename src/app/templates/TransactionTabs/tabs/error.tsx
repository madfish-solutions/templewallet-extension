import React, { memo, useMemo } from 'react';

import ReactJson from 'react-json-view';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { Anchor, CaptionAlert, CopyButton, IconBase, NoSpaceField } from 'app/atoms';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { T, t } from 'lib/i18n';
import { getHumanErrorMessage } from 'lib/temple/error-messages';
import { serializeError } from 'lib/utils/serialize-error';

interface ErrorTabProps {
  isEvm: boolean;
  submitError: unknown;
  estimationError: unknown;
}

export const ErrorTab = memo<ErrorTabProps>(({ isEvm, submitError, estimationError }) => {
  const error = submitError || estimationError;
  const message = useMemo(() => serializeError(error), [error]);
  const humanErrorMessage = useMemo(() => getHumanErrorMessage(error), [error]);
  const showEstimationErrorMessage = !submitError && Boolean(estimationError);
  const errorJson = isEvm
    ? null
    : typeof error === 'object' && error !== null && 'errors' in error
    ? error.errors
    : error;
  console.log('ebota 1', errorJson);

  if (!message) return null;

  return (
    <FadeTransition>
      <CaptionAlert
        type="error"
        title={showEstimationErrorMessage ? t('txCouldNotBeEstimated') : undefined}
        message={humanErrorMessage}
        textClassName="mt-1"
      >
        <div className="flex items-center text-font-description mt-0.5">
          <T
            id="getHelpLink"
            substitutions={
              <Anchor
                href="https://docs.templewallet.com"
                className="text-secondary px-1 py-0.5 flex items-center font-semibold"
              >
                <T id="support" />
                <IconBase size={16} className="-m-1 -ml-0.5" Icon={OutLinkIcon} />
              </Anchor>
            }
          />
        </div>
      </CaptionAlert>

      <div className="mt-3 mb-1 flex flex-row justify-between items-center">
        <p className="p-1 text-font-description-bold">Error Message</p>
        <CopyButton text={message} className="text-secondary flex text-font-description-bold items-center px-1 py-0.5">
          <span>Copy</span>
          <IconBase size={12} Icon={CopyIcon} />
        </CopyButton>
      </div>

      {errorJson ? (
        <div className="w-full h-44 p-3 mb-3 bg-input-low rounded-lg overflow-scroll">
          <ReactJson
            src={errorJson}
            name={null}
            iconStyle="square"
            indentWidth={4}
            collapseStringsAfterLength={36}
            enableClipboard={false}
            displayObjectSize={false}
            displayDataTypes={false}
          />
        </div>
      ) : (
        <NoSpaceField
          value={message}
          textarea
          rows={5}
          readOnly
          placeholder="Info"
          style={{ resize: 'none' }}
          containerClassName="mb-2"
        />
      )}
    </FadeTransition>
  );
});
