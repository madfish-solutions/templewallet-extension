import regexparam from "regexparam";

export type Path = string;
export type Route = string;
export type Params = { [key: string]: string | null };
export type ResolveResult<C> = (params: Params, ctx?: C) => any;
export type Pattern = RegExp;
export type Keys = Array<string> | false;
export type RouteMap<C> = Array<[Route, ResolveResult<C>]>;
export type PreparedRouteMap<C> = Array<{
  route: Route;
  resolveResult: ResolveResult<C>;
  pattern: RegExp;
  keys: Array<string> | false;
}>;

export const NOT_FOUND = Symbol("Woozie.Router.NotFound");

export function resolve<C>(
  path: Path,
  preparedRM: PreparedRouteMap<C>,
  ctx?: C
): any {
  for (const { resolveResult, pattern, keys } of preparedRM) {
    if (pattern.test(path)) {
      const params = createParams(path, pattern, keys);
      const result = resolveResult(params, ctx);
      if (result !== NOT_FOUND) {
        return result;
      }
    }
  }

  return NOT_FOUND;
}

export function prepare<C>(routeMap: RouteMap<C>): PreparedRouteMap<C> {
  return routeMap.map(([route, resolveResult]) => {
    const { pattern, keys } = regexparam(route);
    return {
      route,
      resolveResult,
      pattern,
      keys
    };
  });
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
