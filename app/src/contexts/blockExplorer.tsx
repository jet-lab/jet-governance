import { createContext, useContext, useState } from "react";

// Block explorers
const blockExplorers: Record<string, Record<string, string>> = {
  solanaExplorer: {
    name: "Solana Explorer",
    img: "img/explorers/solana_explorer.svg",
    urlTx: "https://explorer.solana.com/tx/",
    urlAccount: "https://explorer.solana.com/address/"
  },
  solscan: {
    name: "Solscan",
    img: "img/explorers/solscan.svg",
    urlTx: "https://solscan.io/tx/",
    urlAccount: "https://solscan.io/account/"
  },
  solanaBeach: {
    name: "Solana Beach",
    img: "img/explorers/solana_beach.svg",
    urlTx: "https://solanabeach.io/transaction/",
    urlAccount: "https://solanabeach.io/address/"
  }
};

// Block explorer context
interface BlockExplorer {
  preferredExplorer: string;
  setPreferredExplorer: (blockExplorer: string) => void;
}
const BlockExplorerContext = createContext<BlockExplorer>({
  preferredExplorer: "",
  setPreferredExplorer: () => null
});

// Block explorer context provider
export function BlockExplorerProvider(props: { children: JSX.Element }): JSX.Element {
  const [preferredExplorer, setPreferredExplorer] = useState(
    localStorage.getItem("jetPreferredExplorer") ?? "solscan"
  );

  return (
    <BlockExplorerContext.Provider
      value={{
        preferredExplorer,
        setPreferredExplorer
      }}
    >
      {props.children}
    </BlockExplorerContext.Provider>
  );
}

// Block explorer hook
export const useBlockExplorer = () => {
  const { preferredExplorer, setPreferredExplorer } = useContext(BlockExplorerContext);
  const baseTxUrl = blockExplorers[preferredExplorer].urlTx;
  const baseAccountUrl = blockExplorers[preferredExplorer].urlAccount;
  const clusterParam = process.env.REACT_APP_CLUSTER === "devnet" ? "?cluster=devnet" : "";
  return {
    blockExplorers,
    preferredExplorer,
    changePreferredExplorer: (preferredExplorer: string) => {
      localStorage.setItem("jetPreferredExplorer", preferredExplorer);
      setPreferredExplorer(preferredExplorer);
    },
    getTxExplorerUrl: (txId: string) => baseTxUrl + txId + clusterParam,
    getAccountExplorerUrl: (accountId: string) => baseAccountUrl + accountId + clusterParam
  };
};
