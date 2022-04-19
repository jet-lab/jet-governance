import { setProgramIds, useLocalStorageState } from "../utils";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { createContext, useContext, useMemo } from "react";

export enum ENV {
  MainnetBeta = "mainnet-beta",
  Testnet = "testnet",
  Devnet = "devnet",
  localnet = "localnet"
}

export const ENDPOINTS = [
  {
    name: "mainnet-beta" as ENV,
    endpoint: "https://jetprot-main-0d7b.mainnet.rpcpool.com",
    ChainId: ENV.MainnetBeta
  },
  {
    name: "testnet" as ENV,
    endpoint: clusterApiUrl("testnet"),
    ChainId: ENV.Testnet
  },
  {
    name: "devnet" as ENV,
    endpoint: "https://api.devnet.solana.com/",
    ChainId: ENV.Devnet
  },
  {
    name: "localnet" as ENV,
    endpoint: "http://127.0.0.1:8899",
    ChainId: ENV.localnet
  }
];

const NETWORK = (process.env.REACT_APP_CLUSTER as ENV) ?? ENDPOINTS[0].endpoint;
const DEFAULT = ENDPOINTS.find(end => end.name === NETWORK)?.endpoint ?? ENDPOINTS[0].endpoint;

interface ConnectionConfig {
  connection: Connection;
  endpoint: string;
  env: ENV;
  setEndpoint: (val: string) => void;
  inDevelopment: boolean;
}

const ConnectionContext = createContext<ConnectionConfig>({
  endpoint: DEFAULT,
  setEndpoint: () => {},
  connection: new Connection(DEFAULT, "recent"),
  env: NETWORK,
  inDevelopment: false
});

export function ConnectionProvider({ children = undefined as any }) {
  const [endpoint, setEndpoint] = useLocalStorageState("connectionEndpoint", DEFAULT);

  const connection = useMemo(() => new Connection(endpoint, "recent"), [endpoint]);

  const env = ENDPOINTS.find(end => end.endpoint === endpoint)?.name || NETWORK;

  const inDevelopment = env === "devnet";

  setProgramIds(env);

  return (
    <ConnectionContext.Provider
      value={{
        endpoint,
        setEndpoint,
        connection,
        env,
        inDevelopment
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
    env: context.env,
    inDevelopment: context.inDevelopment
  };
}
