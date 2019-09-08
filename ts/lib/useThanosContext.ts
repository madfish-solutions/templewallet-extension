import * as React from "react";
import createUseContext from "constate";
import useThanosSDKContext from "./useThanosSDKContext";
import useAccountContext from "./useAccountContext";

export default createUseContext(useThanos);

function useThanos() {
  const {
    conseilJsLoaded,
    initializeAccount,
    activateAccount,
    isAccountRevealed,
    sendTransaction
  } = useThanosSDKContext();
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
  const [{ activated, activating }, setActState] = React.useState(() => ({
    activated: false,
    activating: false
  }));

  React.useEffect(() => {
    if (keystore) {
      (async () => {
        try {
          setActState({ activated: false, activating: true });
          const activated = await isAccountRevealed(
            (keystore as any).publicKeyHash
          );
          setActState({ activated, activating: false });
        } catch (err) {
          setActState({ activated: false, activating: false });
        }
      })();
    }
  }, [keystore]);

  const activateAcc = async () => {
    try {
      setActState({ activated: false, activating: true });
      await activateAccount(keystore, (account as any).secret);
      alert("DONE!\nWait some time until the network confirm you.");
      setActState({ activated: false, activating: false });
    } catch (err) {
      alert(
        `Oops, Activation Error!\nIf you already submit account activation - wait some time until the network confirm you.`
      );
      setActState({ activated: false, activating: false });
    }
  };

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
    logout,
    activated,
    activating,
    activateAcc,
    sendTransaction
  };
}
