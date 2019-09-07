import * as React from "react";
import createUseContext from "constate";

export default createUseContext(useAccount);

const ACC_FIELDS = ["mnemonic", "email", "secret", "amount", "pkh", "password"];

function useAccount() {
  const [{ initialized, account }, setState] = React.useState(() => ({
    initialized: false,
    account: null
  }));

  const setup = React.useCallback(
    acc => {
      setState({
        account: acc && isAccValid(acc) ? acc : null,
        initialized: true
      });
    },
    [setState]
  );

  React.useEffect(() => {
    try {
      chrome.storage.sync.get(ACC_FIELDS, setup);
    } catch (_err) {}
  }, [setup]);

  return {
    initialized,
    account,
    setup
  };
}

function isAccValid(acc: import("conseiljs").KeyStore) {
  return ACC_FIELDS.every(field => field in acc);
  // [acc.publicKey, acc.privateKey, acc.publicKeyHash].every(Boolean)
}
