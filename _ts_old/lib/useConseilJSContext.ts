import createUseContext from "constate";
import useScript from "lib/useScript";

type ConseilJS = typeof import("conseiljs");

export default createUseContext(useConseilJS);

function useConseilJS() {
  const [loaded, error] = useScript("scripts/conseiljs@0.2.8.min.js");

  if (!loaded) {
    return null;
  }

  if (error) {
    throw error;
  }

  const conseiljs = (window as any).conseiljs as ConseilJS;
  if (!conseiljs) {
    throw new Error("'conseiljs' not founded in global scope");
  }

  return conseiljs;
}
