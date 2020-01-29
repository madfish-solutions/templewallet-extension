import * as React from "react";
import * as Woozie from "lib/woozie";
import { ThanosWalletProvider } from "lib/thanos-wallet";
import PageLayout from "app/layout/PageLayout";
import ErrorBoundary from "app/ErrorBoundary";
import Page from "app/Page";

const App: React.FC<{ popup?: boolean }> = ({ popup }) => (
  <ErrorBoundary>
    <React.Suspense fallback={null}>
      <AppProvider>
        <PageLayout popup={popup}>
          <Page />
        </PageLayout>
      </AppProvider>
    </React.Suspense>
  </ErrorBoundary>
);

export default App;

const AppProvider: React.FC = ({ children }) => (
  <Woozie.Provider>
    <ThanosWalletProvider>{children}</ThanosWalletProvider>
  </Woozie.Provider>
);

// const Explore: React.FC = () => {
//   const {
//     tezos,
//     getBalance,
//     account,
//     importAccount
//   } = useThanosWalletContext();

//   // React.useEffect(() => {
//   //   (async () => {
//   //     try {
//   //       const r = await tezos.rpc.getManagerKey(
//   //         "tz1NAozDvi5e7frVq9cUaC3uXQQannemB8Jw"
//   //       );
//   //       console.info(r);
//   //     } catch (err) {
//   //       console.error(err);
//   //     }
//   //   })();
//   // }, []);

//   // React.useEffect(() => {
//   //   getBalance("tz1Y6nPWCD16CUefkwb9Va4ASAb51HUcXCFB")
//   //     .then(b => console.info(b.toString()))
//   //     .catch(console.error);
//   // }, [getBalance]);

//   // React.useEffect(() => {
//   //   (async () => {
//   //     try {
//   //       await tezos.importKey(
//   //         FAUCET_KEY.email,
//   //         FAUCET_KEY.password,
//   //         FAUCET_KEY.mnemonic.join(" "),
//   //         FAUCET_KEY.secret
//   //       );

//   //       // const b = await tezos.tz.getBalance(FAUCET_KEY.pkh);
//   //       // console.info(b.toString());

//   //       const op = await tezos.contract.transfer({
//   //         to: "tz1NAozDvi5e7frVq9cUaC3uXQQannemB8Jw",
//   //         amount: 1 // +tezos.format("mutez", "tz", b)
//   //       });

//   //       const block = await op.confirmation();
//   //       alert(`Block height: ${block}`);
//   //     } catch (err) {
//   //       console.error(err);
//   //     }
//   //   })();
//   // }, [tezos]);

//   return <>Explore: {account}</>;
// };
// const Faq: React.FC = () => <>FAQ</>;
// const NotFound: React.FC = () => <>Not Found</>;

// const FAUCET_KEY = {
//   mnemonic: [
//     "toward",
//     "boss",
//     "essay",
//     "annual",
//     "crucial",
//     "fiber",
//     "mad",
//     "absent",
//     "doctor",
//     "domain",
//     "coffee",
//     "hint",
//     "image",
//     "inherit",
//     "soup"
//   ],
//   secret: "9c5657e01dec2615172954b21dba89a9e0ec5d2a",
//   amount: "9140080759",
//   pkh: "tz1Ly9rsbJTnF7q5ojUuoerHcAxJzhXo8RML",
//   password: "csPKqohjqd",
//   email: "kgsbleqi.ztieyeri@tezos.example.org"
// };

// {
//   mnemonic: [
//     "ridge",
//     "sauce",
//     "puppy",
//     "label",
//     "flush",
//     "soldier",
//     "trophy",
//     "session",
//     "bonus",
//     "reopen",
//     "gallery",
//     "strategy",
//     "jeans",
//     "tattoo",
//     "crash"
//   ],
//   secret: "3a99071ced646378aa07ad1eb1e8808bd2447cdb",
//   amount: "4105356706",
//   pkh: "tz1Y6nPWCD16CUefkwb9Va4ASAb51HUcXCFB",
//   password: "3iHdgLfs9F",
//   email: "sdavibob.graiaovj@tezos.example.org"
// };
