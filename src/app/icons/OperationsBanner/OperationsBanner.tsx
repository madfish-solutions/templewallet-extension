import React, { CSSProperties, memo, ReactNode } from 'react';

import classNames from 'clsx';
import ReactJson from 'react-json-view';

import { ReactComponent as CopyIcon } from 'app/icons/monochrome/copy.svg';
import { setTestID } from 'lib/analytics';
import { T } from 'lib/i18n';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

import { OperationsBannerSelectors } from './OperationsBanner.selectors';

type ContentsItem = {
  kind: string;
  source: string;
  fee: string;
  counter: string;
  gas_limit: string;
  storage_limit: string;
  amount: string;
  destination: string;
};

type OperationsBannerProps = {
  jsonViewStyle?: CSSProperties;
  opParams: any[] | { branch: string; contents: ContentsItem[] } | string;
  modifiedTotalFee?: number;
  modifiedStorageLimit?: number;
  label?: ReactNode;
  className?: string;
  copyButtonClassName?: string;
};

const OperationsBanner = memo<OperationsBannerProps>(
  ({ jsonViewStyle, opParams, modifiedTotalFee, modifiedStorageLimit, label, className, copyButtonClassName }) => {
    opParams = typeof opParams === 'string' ? opParams : formatOpParams(opParams);

    if (typeof opParams === 'object' && !Array.isArray(opParams)) {
      opParams = enrichParams(opParams, modifiedStorageLimit, modifiedTotalFee);
    }

    const collapsedArgs = Array.isArray(opParams) ? 2 : 3;

    return (
      <>
        {label && (
          <h2 className={classNames('w-full mb-2', 'text-base font-semibold leading-tight', 'text-gray-700')}>
            {label}
          </h2>
        )}

        <div className={classNames('relative mb-2', className)}>
          <div
            className={classNames(
              'block w-full max-w-full p-1',
              'rounded-md',
              'border-2 bg-gray-100/50',
              'text-xs leading-tight font-medium',
              typeof opParams === 'string' ? 'break-all' : 'whitespace-nowrap overflow-auto'
            )}
            style={{
              height: '10rem',
              ...jsonViewStyle
            }}
            {...setTestID(OperationsBannerSelectors.errorValue)}
          >
            {typeof opParams === 'string' ? (
              <div className={classNames('p-1', 'text-lg text-gray-700 font-normal whitespace-pre-line')}>
                {opParams}
              </div>
            ) : (
              <ReactJson
                src={opParams}
                name={null}
                iconStyle="square"
                indentWidth={4}
                collapsed={collapsedArgs}
                collapseStringsAfterLength={36}
                enableClipboard={false}
                displayObjectSize={false}
                displayDataTypes={false}
              />
            )}
          </div>

          <div className={classNames('absolute top-0 right-0 pt-2 pr-2', copyButtonClassName)}>
            <CopyButton toCopy={opParams} />
          </div>
        </div>
      </>
    );
  }
);

type opParamsType = {
  branch: string;
  contents: ContentsItem[];
};

const enrichParams = (opParams: opParamsType, modifiedStorageLimit?: number, modifiedTotalFee?: number) => ({
  ...opParams,
  contents:
    opParams.contents &&
    opParams.contents.map((elem, i, contents) => {
      if (i === 0) {
        let newElem = elem;
        if (modifiedTotalFee !== undefined) {
          newElem = {
            ...newElem,
            fee: JSON.stringify(modifiedTotalFee)
          };
        }

        if (modifiedStorageLimit !== undefined && contents.length < 2) {
          newElem = {
            ...newElem,
            storage_limit: JSON.stringify(modifiedStorageLimit)
          };
        }

        return newElem;
      }

      return elem;
    })
});

export default OperationsBanner;

type CopyButtonProps = {
  toCopy: any;
};

const CopyButton = memo<CopyButtonProps>(({ toCopy }) => {
  const { fieldRef, copy, copied } = useCopyToClipboard<HTMLTextAreaElement>();

  const text = typeof toCopy === 'string' ? toCopy : JSON.stringify(toCopy, null, 2);

  return (
    <>
      <button
        type="button"
        className={classNames(
          'mx-auto',
          'p-1',
          'bg-primary-orange rounded',
          'border border-primary-orange',
          'flex items-center justify-center',
          'text-primary-orange-lighter text-shadow-black-orange',
          'text-xs font-semibold leading-snug',
          'transition duration-300 ease-in-out',
          'opacity-90 hover:opacity-100 focus:opacity-100',
          'shadow-xs',
          'hover:shadow focus:shadow'
        )}
        onClick={copy}
      >
        {copied ? <T id="copiedHash" /> : <CopyIcon className={classNames('h-4 w-auto', 'stroke-current stroke-2')} />}
      </button>

      <textarea ref={fieldRef} value={text} readOnly className="sr-only" />
    </>
  );
});

function formatOpParams(opParams: any) {
  try {
    if ('contents' in opParams) {
      return {
        ...opParams,
        contents: opParams.contents.map(formatTransferParams)
      };
    } else {
      return opParams.map(formatTransferParams);
    }
  } catch {
    return opParams;
  }
}

function formatTransferParams(tParams: any) {
  const { to, mutez, parameter, ...rest } = tParams;
  const newTParams = to ? { destination: to, ...rest } : rest;
  if (parameter) {
    newTParams.parameters = parameter;
  }
  return newTParams;
}
