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

  useEffect(() => {
    if (publicKey && !verified) {
      // notify({
      //   message: 'Checking eligibility',
      //   description: 'You cannot access Jet Govern',
      // });
    }
    // setVerified(true);
  }, [publicKey, verified]);

  return (
    <ConnectWalletContext.Provider value={{ connecting, setConnecting }}>
      {publicKey && <VerifyModal showModal={!verified} onOk={() => setVerified(true)} />}
      {props.children}
    </ConnectWalletContext.Provider>
  );
};

export const useConnectWallet = () => {
  const context = useContext(ConnectWalletContext);
  
  return context;
};