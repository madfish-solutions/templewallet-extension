import * as React from "react";
import createUseContext from "constate";
import useThanosSDK from "./useThanosSDK";
import useAccountContext from "./useAccountContext";

export default createUseContext(useThanos);

function useThanos() {
  const {
    conseilJsLoaded,
    initializeAccount,
    activateAccount,
    getTotalBalance,
    getAccount,
    getTransactions,
    sendTransaction
  } = useThanosSDK();
  const { initialized: accInitialized, account } = useAccountContext();

  const [{ ready }, setState] = React.useState(() => ({
    ready: false
  }));

  React.useEffect(() => {
    if (accInitialized && conseilJsLoaded && account) {
      (async () => {
        try {
          const keystore = await initializeAccount(account);
          console.info("YEAH, keystore:", keystore);
          console.info(
            "YEAH",
            await activateAccount(keystore, (account as any).secret)
          );
        } catch (err) {
          console.error(err);
        }
      })();
    }
  }, [conseilJsLoaded, accInitialized, account]);

  return {
    ready
  };
}
