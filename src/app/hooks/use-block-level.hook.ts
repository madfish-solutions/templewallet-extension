import { useEffect, useState } from 'react';

import { useTezos } from 'lib/temple/front';

export const useBlockLevel = () => {
  const tezos = useTezos();

  const [blockLevel, setBlockLevel] = useState<number>();

  useEffect(() => {
    const subscription = tezos.stream.subscribeBlock('head');

    subscription.on('data', block => {
      setBlockLevel(block.header.level);
    });

    return () => subscription.close();
  }, [tezos]);

  return blockLevel;
};
