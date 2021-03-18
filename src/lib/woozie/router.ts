import { FC } from "react";

import regexparam from "regexparam";

export type Path = string;
export type Route = string;
export type Params = { [key: string]: string | null };
export type ResolveResult<C> = (params: Params, ctx: C) => ReturnType<FC> | typeof SKIP;
export type Pattern = RegExp;
export type Keys = Array<string> | false;
export type Routes<C> = Array<[Route, ResolveResult<C>]>;
export type RouteMap<C> = Array<{
  route: Route;
  resolveResult: ResolveResult<C>;
  pattern: RegExp;
  keys: Array<string> | false;
}>;

export const SKIP = Symbol("Woozie.Router.Skip");

export function createMap<C>(routes: Routes<C>): RouteMap<C> {
  return routes.map(([route, resolveResult]) => {
    const { pattern, keys } = regexparam(route);
    return {
      route,
      resolveResult,
      pattern,
      keys,
    };
  });
}

export function resolve<C>(preparedRM: RouteMap<C>, path: Path, ctx: C): ReturnType<FC> {
  for (const { resolveResult, pattern, keys } of preparedRM) {
    if (pattern.test(path)) {
      const params = createParams(path, pattern, keys);
      const result = resolveResult(params, ctx);
      if (result !== SKIP) {
        return result;
      }
    }
  }

  // Page not found
  return null;
}

function createParams(path: Path, pattern: Pattern, keys: Keys): Params {
  const params: Params = {};

  if (!keys) {
    return params;
  }

  const matches = pattern.exec(path);
  if (!matches) {
    return params;
  }

  let i = 0;
  while (i < keys.length) {
    params[keys[i]] = matches[++i] || null;
  }
  return params;
}
