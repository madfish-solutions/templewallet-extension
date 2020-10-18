import * as React from "react";
import { Substitutions } from "./types";
import { toList } from "./helpers";
import { getMessage } from "./core";

export * from "./index";

export type ReactSubstitutions = React.ReactNode | React.ReactNode[];

export type TProps = {
  id: string;
  substitutions?: any;
  children?: (m: React.ReactNode | string | null) => React.ReactElement;
};

export const T: React.FC<TProps> = ({ id, substitutions, children }) => {
  const message = React.useMemo(() => t(id, substitutions), [
    id,
    substitutions,
  ]);

  return React.useMemo(() => (children ? children(message) : <>{message}</>), [
    message,
    children,
  ]);
};

export function t(messageName: string, substitutions?: Substitutions): string;
export function t(
  messageName: string,
  substitutions?: ReactSubstitutions
): React.ReactNode;
export function t(messageName: string, substitutions?: any): any {
  if (!substitutions || !hasReactSubstitutions(substitutions)) {
    return getMessage(messageName, substitutions);
  }

  const subList = toList(substitutions);
  const tmp = getMessage(
    messageName,
    subList.map(() => "$$")
  );

  return (
    <>
      {tmp.split("$$").map((part, i) => (
        <>
          {part.split("\n").map((subPart, j) => (
            <>
              {j > 0 && <br />}
              {subPart}
            </>
          ))}
          {subList[i]}
        </>
      ))}
    </>
  );
}

function hasReactSubstitutions(
  substitutions: Substitutions | ReactSubstitutions
): substitutions is ReactSubstitutions {
  return Array.isArray(substitutions)
    ? substitutions.some(isReactSubstitution)
    : isReactSubstitution(substitutions);
}

function isReactSubstitution(sub: any) {
  return sub !== null && (typeof sub === "function" || typeof sub === "object");
}
