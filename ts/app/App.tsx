import * as React from "react";
import ContextProvider from "lib/ContextProvider";
import Layout from "./App/Layout";
import View from "./App/View";
import useThanosContext from "lib/useThanosContext";

interface AppProps {
  popup?: boolean;
}

const App: React.FC<AppProps> = ({ popup }) => {
  return (
    <ContextProvider>
      <Layout popup>
        <View />
        <ThanosCheck />
      </Layout>
    </ContextProvider>
  );
};

export default App;

const ThanosCheck: React.FC = () => {
  const { initialized, loading, authorized, keystore } = useThanosContext();

  React.useEffect(() => {
    console.info(keystore);
  }, [keystore]);

  // React.useEffect(() => {
  //   if (initialized) {
  //     (async () => {
  //       try {
  //         await authorize({
  //           mnemonic: [
  //             "garbage",
  //             "utility",
  //             "estate",
  //             "lounge",
  //             "lava",
  //             "fantasy",
  //             "wish",
  //             "old",
  //             "alter",
  //             "clinic",
  //             "because",
  //             "vintage",
  //             "donate",
  //             "trumpet",
  //             "lemon"
  //           ].join(" "),
  //           secret: "129f0ea640d93dfbe8c25e640f521441f6f848f1",
  //           amount: "43888838596",
  //           pkh: "tz1abiiJXDW9hdCAbpF79xM5EVK1diAgnXeH",
  //           password: "F7MTvJTNFW",
  //           email: "htrtjpnq.jgczvxww@tezos.example.org"
  //         });
  //       } catch (err) {
  //         console.error("Auth error", err);
  //       }
  //     })();
  //   }
  // }, [initialized, authorize]);

  return null;
};
