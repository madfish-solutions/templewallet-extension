import * as React from "react";
import * as Woozie from "lib/woozie";
import { useThanosWalletContext } from "lib/thanos-wallet";
import ExploreAccount from "app/pages/ExploreAccount";
import ImportAccountFromFile from "app/pages/ImportAccountFromFile";
import ImportAccountManual from "app/pages/ImportAccountManual";
import ReceiveFunds from "app/pages/ReceiveFunds";
import TransferFunds from "app/pages/TransferFunds";

const ROUTE_MAP = Woozie.Router.prepare([
  [
    "/",
    (_p, authed) => (
      <Woozie.Redirect to={authed ? "/account" : "/import/manual"} />
    )
  ],
  [
    "/import/file",
    (_p, authed) =>
      !authed ? <ImportAccountFromFile /> : <Woozie.Redirect to="/" />
  ],
  [
    "/import/manual",
    (_p, authed) =>
      !authed ? <ImportAccountManual /> : <Woozie.Redirect to="/" />
  ],
  [
    "/account",
    (_p, authed) => (authed ? <ExploreAccount /> : <Woozie.Redirect to="/" />)
  ],
  [
    "/account/receive",
    (_p, authed) => (authed ? <ReceiveFunds /> : <Woozie.Redirect to="/" />)
  ],
  [
    "/account/transfer",
    (_p, authed) => (authed ? <TransferFunds /> : <Woozie.Redirect to="/" />)
  ],
  ["*", () => <Woozie.Redirect to="/" />]
]);

const Page: React.FC = () => {
  const { account } = useThanosWalletContext();
  const { trigger, pathname } = Woozie.useLocationContext();

  // Scroll to Top after new location pushed
  React.useEffect(() => {
    if (trigger === Woozie.HistoryAction.Push) {
      window.scrollTo(0, 0);
    }
  });

  const authorized = React.useMemo(() => Boolean(account), [account]);
  return Woozie.Router.resolve(pathname, ROUTE_MAP, authorized);
};

export default Page;
