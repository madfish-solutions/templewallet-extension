import React, {
  createContext,
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  PropsWithChildren
} from 'react';

import { noop } from 'lodash';

import { createWsConnection, TzktHubConnection } from 'lib/apis/tzkt';
import { useUpdatableRef } from 'lib/ui/hooks';
import { useTezosNetwork } from 'temple/front';

import { useTempleClient } from './client';

interface TzktConnectionContextValue {
  connection: TzktHubConnection | undefined;
  connectionReady: boolean;
}

const DEFAULT_VALUE: TzktConnectionContextValue = {
  connection: undefined,
  connectionReady: false
};

const TzktConnectionContext = createContext<TzktConnectionContextValue>(DEFAULT_VALUE);

export const useTzktConnection = () => useContext(TzktConnectionContext);

const NotReadyClientTzktConnectionProvider: FC<PropsWithChildren> = ({ children }) => (
  <TzktConnectionContext.Provider value={DEFAULT_VALUE}>{children}</TzktConnectionContext.Provider>
);

const ReadyClientTzktConnectionProvider: FC<PropsWithChildren> = ({ children }) => {
  const { chainId } = useTezosNetwork();
  const [connectionReady, setConnectionReadyState] = useState(false);
  const connectionReadyRef = useUpdatableRef(connectionReady);
  const shouldShutdownConnection = useRef(false);

  const connection = useMemo(() => (chainId ? createWsConnection(chainId) : undefined), [chainId]);

  const initConnection = useCallback(async () => {
    if (!connection) {
      return;
    }

    setConnectionReadyState(false);
    try {
      await connection.start();
      shouldShutdownConnection.current = false;
      connection.onclose(e => {
        if (!shouldShutdownConnection.current) {
          console.error(e);
          setConnectionReadyState(false);
          setTimeout(() => initConnection(), 1000);
        }
      });
      setConnectionReadyState(true);
    } catch (e) {
      console.error(e);
    }
  }, [connection]);

  useEffect(() => {
    if (connection) {
      initConnection();

      return () => {
        if (connectionReadyRef.current) {
          shouldShutdownConnection.current = true;
          connection.stop().catch(e => console.error(e));
        }
      };
    }

    return noop;
  }, [connection, initConnection]);

  const contextValue = useMemo(
    () => ({
      connection,
      connectionReady
    }),
    [connection, connectionReady]
  );

  return <TzktConnectionContext.Provider value={contextValue}>{children}</TzktConnectionContext.Provider>;
};

export const TzktConnectionProvider: FC<PropsWithChildren> = ({ children }) => {
  const { ready } = useTempleClient();

  return useMemo(
    () =>
      ready ? (
        <ReadyClientTzktConnectionProvider>{children}</ReadyClientTzktConnectionProvider>
      ) : (
        <NotReadyClientTzktConnectionProvider>{children}</NotReadyClientTzktConnectionProvider>
      ),
    [children, ready]
  );
};
