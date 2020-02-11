import * as React from "react";
import * as Woozie from "lib/woozie";
import { useThanosFrontContext } from "lib/thanos/front";
import Unlock from "app/pages/Unlock";
import ImportAccount from "app/pages/ImportAccount";
import Explore from "app/pages/Explore";

interface RouteContext {
  thanosFront: ReturnType<typeof useThanosFrontContext>;
}

const ROUTE_MAP = Woozie.Router.createMap<RouteContext>([
  [
    "*",
    (_p, { thanosFront }) =>
      thanosFront.unlocked ? Woozie.Router.NOT_FOUND : <Unlock />
  ],
  [
    "/",
    (_p, { thanosFront }) => (
      <Woozie.Redirect to={thanosFront.authorized ? "/explore" : "/signin"} />
    )
  ],
  [
    "/signin",
    (_p, { thanosFront }) =>
      thanosFront.authorized ? <Woozie.Redirect to="/" /> : <ImportAccount />
  ],
  [
    "/explore",
    (_p, { thanosFront }) =>
      thanosFront.authorized ? <Explore /> : <Woozie.Redirect to="/" />
  ],
  ["*", () => <Woozie.Redirect to="/" />]
]);

const Page: React.FC = () => {
  const { trigger, pathname } = Woozie.useLocationContext();
  const thanosFront = useThanosFrontContext();

  // Scroll to top after new location pushed.
  React.useLayoutEffect(() => {
    if (trigger === Woozie.HistoryAction.Push) {
      window.scrollTo(0, 0);
    }
  }, [trigger, pathname]);

  const ctx = React.useMemo<RouteContext>(() => ({ thanosFront }), [
    thanosFront
  ]);
  return Woozie.Router.resolve(ROUTE_MAP, pathname, ctx);
};

export default Page;

// import ExploreAccount from "app/pages/ExploreAccount";
// import ImportAccountFromFile from "app/pages/ImportAccountFromFile";
// import ImportAccountManual from "app/pages/ImportAccountManual";
// import ReceiveFunds from "app/pages/ReceiveFunds";
// import TransferFunds from "app/pages/TransferFunds";

// [
//   "/import/file",
//   (_p, authed) =>
//     !authed ? <ImportAccountFromFile /> : <Woozie.Redirect to="/" />
// ],
// [
//   "/import/manual",
//   (_p, authed) =>
//     !authed ? <ImportAccountManual /> : <Woozie.Redirect to="/" />
// ],
// [
//   "/account",
//   (_p, authed) => (authed ? <ExploreAccount /> : <Woozie.Redirect to="/" />)
// ],
// [
//   "/account/receive",
//   (_p, authed) => (authed ? <ReceiveFunds /> : <Woozie.Redirect to="/" />)
// ],
// [
//   "/account/transfer",
//   (_p, authed) => (authed ? <TransferFunds /> : <Woozie.Redirect to="/" />)
// ],
