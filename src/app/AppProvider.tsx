import React, { ComponentProps, FC } from 'react';

import { AppEnvProvider } from 'app/env';
import { TempleProvider } from 'lib/temple/front';
import * as Woozie from 'lib/woozie';

type AppProps = {
  env: ComponentProps<typeof AppEnvProvider>;
};

export const AppProvider: FC<AppProps> = ({ children, env }) => (
  <AppEnvProvider {...env}>
    <Woozie.Provider>
      <TempleProvider>{children}</TempleProvider>
    </Woozie.Provider>
  </AppEnvProvider>
);
