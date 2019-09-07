import * as React from "react";
import useForceUpdate from "use-force-update";
import { HistoryAction, HistoryWithLastAction } from "./history";

export default function useHistory() {
  const forceUpdate = useForceUpdate();

  React.useEffect(() => {
    window.addEventListener(HistoryAction.Pop, handlePopstate);
    window.addEventListener(HistoryAction.Push, handlePushstate);
    window.addEventListener(HistoryAction.Replace, handleReplacestate);

    return () => {
      window.removeEventListener(HistoryAction.Pop, handlePopstate);
      window.removeEventListener(HistoryAction.Push, handlePushstate);
      window.removeEventListener(HistoryAction.Replace, handleReplacestate);
    };

    function handlePopstate() {
      patchLastAction(HistoryAction.Pop);
      forceUpdate();
    }
    function handlePushstate() {
      patchLastAction(HistoryAction.Push);
      forceUpdate();
    }
    function handleReplacestate() {
      patchLastAction(HistoryAction.Replace);
      forceUpdate();
    }

    function patchLastAction(action: HistoryAction) {
      (window.history as HistoryWithLastAction).lastAction = action;
    }
  }, [forceUpdate]);
}
