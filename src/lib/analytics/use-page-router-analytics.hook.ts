import { useEffect } from "react";

import { useAnalytics } from "./use-analytics.hook";

const pageRoutesWithToken = ["/explore", "/send", "/swap"];

export const usePageRouterAnalytics = (
  pathname: string,
  search: string,
  isContextReady: boolean
) => {
  const { pageEvent } = useAnalytics();

  useEffect(() => {
    if (pathname === "/" && !isContextReady) {
      return void pageEvent("/welcome", search);
    }

    if (pageRoutesWithToken.some((route) => pathname.startsWith(route))) {
      const [, route = "", tokenSlug = "tez"] = pathname.split("/");
      const [tokenAddress, tokenId = "0"] = tokenSlug.split("_");

      return void pageEvent(`/${route}`, search, tokenAddress, tokenId);
    }

    return void pageEvent(pathname, search);
  }, [pathname, search, isContextReady, pageEvent]);
};
