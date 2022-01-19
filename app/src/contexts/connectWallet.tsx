import { useWallet } from "@solana/wallet-adapter-react";
import React, { createContext, useContext, useState, useEffect } from "react";
import { notify } from "../utils";
import { VerifyModal } from "../components/modals/VerifyModal"
import { isAddressWhitelisted, isAddressAuthenticated } from "../models/WHITELISTED_ADDRESSES"

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
  const { publicKey, disconnect } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(publicKey);

  const [verifyModalVisible, setVerifyModalVisible] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [verified, setVerified] = useState(false);

  // TODO FIXME: Modal should appear if wallet is connected by user and !verified, defaulting to step 3.

  useEffect(() => {
    // Check if address has been previously authenticated
    if (publicKey && isAddressAuthenticated(publicKey.toString())) {
      setAuthenticated(true);
    }
    // Check if address is whitelisted
    if (publicKey && isAddressWhitelisted(publicKey.toString())) {
      setVerified(true);
    };
  }, [publicKey, verified, authenticated]);
  
  useEffect(() => {
    if (publicKey && authenticated === true && verified === false) {
      // if (verified === true){
      // // Do not show verify modal again
      //   setVerifyModalVisible(false)
      // } else if (verified === false) {
      disconnect();
      // }
    }
  }, [publicKey, verified, authenticated, disconnect])

  return (
    <ConnectWalletContext.Provider value={{ connecting, setConnecting }}>
      <VerifyModal
        visible={verifyModalVisible}
        onClose={() => setVerifyModalVisible(false)}
        verified={verified}
        authenticated={authenticated}
      />
      {props.children}
    </ConnectWalletContext.Provider>
  );
};

export const useConnectWallet = () => {
  const context = useContext(ConnectWalletContext);
  
  return context;
};