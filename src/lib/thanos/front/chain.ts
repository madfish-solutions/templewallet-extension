import * as React from "react";
import { useTezos } from "lib/thanos/front/ready";

export function useOnBlock(callback: (blockHash: string) => void) {
  const tezos = useTezos();

  React.useEffect(() => {
    const sub = tezos.stream.subscribe("head");
    sub.on("data", callback);
    sub.on("error", (err) => {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
    });

    return () => sub.close();
  }, [tezos, callback]);
}
