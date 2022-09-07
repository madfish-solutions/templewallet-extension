import React, { FC, Fragment, ReactElement, ReactNode, useMemo } from 'react';

import type _LocaleMessages from '../../../public/_locales/en/messages.json';
import { getMessage } from './core';
import { toList } from './helpers';
import { Substitutions } from './types';

export * from './index';

export type ReactSubstitutions = ReactNode | ReactNode[];

export type TID = keyof typeof _LocaleMessages;

/*
export const TIDS = Object.fromEntries(
  Object.keys(_LocaleMessages).map(k => [k, k])
) as { [k in TID]: k };
*/

export type TProps = {
  id: TID;
  substitutions?: any;
  children?: (m: ReactNode | string | null) => ReactElement;
};

export const T: FC<TProps> = ({ id, substitutions, children }) => {
  const message = useMemo(() => tReact(id, substitutions), [id, substitutions]);

  return useMemo(() => (children ? children(message) : <>{message}</>), [message, children]);
};

export function t(messageName: TID, substitutions?: Substitutions): string;
export function t(messageName: TID, substitutions?: ReactSubstitutions): ReactNode;
export function t(messageName: TID, substitutions?: any): any {
  return !substitutions || !hasReactSubstitutions(substitutions)
    ? getMessage(messageName, substitutions)
    : tReact(messageName, substitutions);
}

function tReact(messageName: TID, substitutions?: Substitutions | ReactSubstitutions): ReactNode {
  const subList = toList(substitutions);
  const tmp = getMessage(
    messageName,
    subList.map(() => TMP_SEPARATOR)
  );

  return (
    <>
      {tmp.split(TMP_SEPARATOR).map((partI, i) => (
        <Fragment key={`i_${i}`}>
          {partI.split('\n').map((partJ, j) => (
            <Fragment key={`j_${j}`}>
              {j > 0 && <br />}
              {partJ.includes('<b>')
                ? partJ
                    .split(BOLD_PATTERN)
                    .map((partK, k) => (
                      <Fragment key={`k_${k}`}>
                        {k % 2 === 0 ? partK : <span className="font-semibold">{partK}</span>}
                      </Fragment>
                    ))
                : partJ}
            </Fragment>
          ))}
          {subList[i]}
        </Fragment>
      ))}
    </>
  );
}

const TMP_SEPARATOR = '$_$';
const BOLD_PATTERN = /<b>(.*?)<\/b>/g;

function hasReactSubstitutions(substitutions: Substitutions | ReactSubstitutions): substitutions is ReactSubstitutions {
  return Array.isArray(substitutions) ? substitutions.some(isReactSubstitution) : isReactSubstitution(substitutions);
}

function isReactSubstitution(sub: any) {
  return sub !== null && (typeof sub === 'function' || typeof sub === 'object');
}
