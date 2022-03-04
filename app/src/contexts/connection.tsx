import { useLocalStorageState } from "../utils/utils";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import React, { useContext, useMemo } from "react";
import { setProgramIds } from "../utils/ids";

export enum ENV {
  MainnetBeta = "mainnet-beta",
  Testnet = "testnet",
  Devnet = "devnet",
  localnet = "localnet"
}

export const ENDPOINTS = [
  {
    name: "mainnet-beta" as ENV,
    endpoint: "https://jetprotocol.genesysgo.net/",
    ChainId: ENV.MainnetBeta
  },
  {
    name: "testnet" as ENV,
    endpoint: clusterApiUrl("testnet"),
    ChainId: ENV.Testnet
  },
  {
    name: "devnet" as ENV,
    endpoint: "https://psytrbhymqlkfrhudd.dev.genesysgo.net:8899/",
    ChainId: ENV.Devnet
  },
  {
    name: "localnet" as ENV,
    endpoint: "http://127.0.0.1:8899",
    ChainId: ENV.localnet
  }
];

const DEFAULT = ENDPOINTS[2].endpoint;

interface ConnectionConfig {
  connection: Connection;
  endpoint: string;
  env: ENV;
  setEndpoint: (val: string) => void;
}

const ConnectionContext = React.createContext<ConnectionConfig>({
  endpoint: DEFAULT,
  setEndpoint: () => {},
  connection: new Connection(DEFAULT, "recent"),
  env: ENDPOINTS[0].name
});

export function ConnectionProvider({ children = undefined as any }) {
  const [endpoint, setEndpoint] = useLocalStorageState("connectionEndpoint", ENDPOINTS[2].endpoint);

  const connection = useMemo(() => new Connection(endpoint, "recent"), [endpoint]);

  const env = ENDPOINTS.find(end => end.endpoint === endpoint)?.name || ENDPOINTS[2].name;

  setProgramIds(env);

  return (
    <ConnectionContext.Provider
      value={{
        endpoint,
        setEndpoint,
        connection,
        env
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  return useContext(ConnectionContext).connection as Connection;
}

export function useConnectionConfig() {
  const context = useContext(ConnectionContext);
  return {
    endpoint: context.endpoint,
    setEndpoint: context.setEndpoint,
    env: context.env
  };
}
