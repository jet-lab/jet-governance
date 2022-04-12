import { createContext, useContext, useEffect, useState } from "react";
import { Connection } from "@solana/web3.js";
import { useProvider, useRpcContext } from "../hooks";
import { useConnection, useConnectionConfig } from "./connection";

// RPC node context
interface RpcNode {
  preferredNode: string | null;
  setPreferredNode: (url: string | null) => void;
  ping: number;
  setPing: (ping: number) => void;
  degradedNetworkPerformance: boolean;
}
const RpcNodeContext = createContext<RpcNode>({
  preferredNode: null,
  setPreferredNode: () => null,
  ping: 0,
  setPing: () => null,
  degradedNetworkPerformance: false
});

// RPC node context provider
export function RpcNodeContextProvider(props: { children: JSX.Element }): JSX.Element {
  const [preferredNode, setPreferredNode] = useState(
    localStorage.getItem("jetPreferredNode") ?? null
  );
  const [ping, setPing] = useState(0);
  const [degradedNetworkPerformance, setDegradedNetworkPerformance] = useState(false);
  const env = useConnectionConfig();

  // Update ping and check for network congestion
  // whenever user's connection changes
  const { connection } = useProvider();
  useEffect(() => {
    const getPing = async () => {
      const startTime = Date.now();
      await connection.getVersion();
      const endTime = Date.now();
      setPing(endTime - startTime);
    };

    const checkNetworkPerformance = async () => {
      const connection = new Connection("https://api.mainnet-beta.solana.com/");
      const samples = await connection.getRecentPerformanceSamples(15);
      const totalTps = samples.reduce((acc, val) => {
        return acc + val.numTransactions / val.samplePeriodSecs;
      }, 0);
      const aveTps = totalTps / samples.length;
      setDegradedNetworkPerformance(aveTps < 1200);
    };

    getPing();
    if (env.endpoint === "mainnet-beta") {
      checkNetworkPerformance();
    }
  }, [connection, env.endpoint, preferredNode]);

  return (
    <RpcNodeContext.Provider
      value={{
        preferredNode,
        setPreferredNode,
        ping,
        setPing,
        degradedNetworkPerformance
      }}
    >
      {props.children}
    </RpcNodeContext.Provider>
  );
}

// RPC node hook
export const useRpcNode = () => {
  const context = useContext(RpcNodeContext);
  return {
    ...context,
    updateRpcNode: (rpcNodeInput?: string) => {
      if (rpcNodeInput) {
        localStorage.setItem("jetPreferredNode", rpcNodeInput);
        context.setPreferredNode(rpcNodeInput);
      } else {
        localStorage.removeItem("jetPreferredNode");
        context.setPreferredNode(null);
      }

      context.setPing(0);
    }
  };
};
