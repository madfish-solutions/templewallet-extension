import * as React from "react";
import createUseContext from "constate";
import useThanosSDKContext from "./useThanosSDKContext";
import useAccountContext from "./useAccountContext";

export default createUseContext(useThanos);

function useThanos() {
  const { conseilJsLoaded, initializeAccount } = useThanosSDKContext();
  const {
    initialized: accInitialized,
    account,
    save,
    clean
  } = useAccountContext();

  const [{ initialized, loading, keystore }, setState] = React.useState(() => ({
    initialized: false,
    loading: false,
    keystore: null
  }));

  const authorize = React.useCallback(
    async acc => {
      await initializeAccount(acc);
      save(acc);
    },
    [initializeAccount, save]
  );

  const init = React.useCallback(() => {
    if (account) {
      setState(state => ({
        ...state,
        initialized: true,
        loading: true
      }));

      (async () => {
        let ks: any;
        try {
          ks = await initializeAccount(account);
        } catch (_err) {
          setState(state => ({ ...state, loading: false }));
          await clean();
          alert("Authorize error");
          return;
        }

        setState(state => ({
          ...state,
          loading: false,
          keystore: ks
        }));
      })();
    } else {
      setState(state => ({
        ...state,
        initialized: true,
        keystore: null
      }));
    }
  }, [account, initializeAccount]);

  React.useEffect(() => {
    if (accInitialized && conseilJsLoaded) {
      init();
    }
  }, [conseilJsLoaded, accInitialized, init]);

  const authorized = Boolean(keystore);
  const logout = clean;
  return {
    initialized,
    loading,
    keystore,
    authorized,
    authorize,
    logout
  };
}
