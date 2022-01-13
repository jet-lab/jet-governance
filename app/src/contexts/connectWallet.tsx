import { useWallet } from "@solana/wallet-adapter-react";
import React, { createContext, useContext, useState, useEffect } from "react";
import { notify } from "../utils";
import { VerifyModal } from "../components/modals/VerifyModal"

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
  const [verified, setVerified] = useState(false);
  const [connected, setConnected] = useState(publicKey);
  const [init, setInit] = useState(true)

  useEffect(() => {
    if (publicKey && !verified) {
      // If wallet has already been SMS checked and cannot access Jet Govern,
      // return;
    }
    // setVerified(true);
  }, [publicKey, verified]);

  return (
    <ConnectWalletContext.Provider value={{ connecting, setConnecting }}>
      {publicKey && <VerifyModal verified={verified} setVerified={() => setVerified(true)} doNotInit={() => setInit(false)} />}
      {init && props.children}
    </ConnectWalletContext.Provider>
  );
};

export const useConnectWallet = () => {
  const context = useContext(ConnectWalletContext);
  
  return context;
};