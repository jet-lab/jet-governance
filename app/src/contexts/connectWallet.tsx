import { useWallet } from "@solana/wallet-adapter-react";
import React, { createContext, useContext, useState, useEffect } from "react";
import { notify } from "../utils";


// Connecting wallet context
interface ConnectWallet {
  connecting: boolean,
  setConnecting: (connecting: boolean) => void
};
const ConnectWalletContext = createContext<ConnectWallet>({
  connecting: false,
  setConnecting: () => {}
});

export const ConnectWalletProvider = (props: { children: any }) => {
  const { publicKey } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(!!publicKey);

  // useEffect(() => {
  //   if (!publicKey && connected) {
  //     notify({
  //       message: 'Wallet update',
  //       description: 'Disconnected from wallet',
  //     });
  //   }
  //   setConnected(!!publicKey);
  // }, [publicKey, connected, setConnected]);

  return (
    <ConnectWalletContext.Provider value={{ connecting, setConnecting }}>
      {props.children}
    </ConnectWalletContext.Provider>
  );
};

// Dark theme hook
export const useConnectWallet = () => {
  const context = useContext(ConnectWalletContext);
  
  return context;
};