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

import { useTempleClient } from './client';
import { useChainId } from './ready';

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
  const chainId = useChainId();
  const [connectionReady, setConnectionReadyState] = useState(false);
  const connectionReadyRef = useRef(connectionReady);
  const shouldShutdownConnection = useRef(false);

  const setConnectionReady = useCallback((newState: boolean) => {
    connectionReadyRef.current = newState;
    setConnectionReadyState(newState);
  }, []);

  const connection = useMemo(() => (chainId ? createWsConnection(chainId) : undefined), [chainId]);

  const initConnection = useCallback(async () => {
    if (!connection) {
      return;
    }

    setConnectionReady(false);
    try {
      await connection.start();
      shouldShutdownConnection.current = false;
      connection.onclose(e => {
        if (!shouldShutdownConnection.current) {
          console.error(e);
          setConnectionReady(false);
          setTimeout(() => initConnection(), 1000);
        }
      });
      setConnectionReady(true);
    } catch (e) {
      console.error(e);
    }
  }, [connection, setConnectionReady]);

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
