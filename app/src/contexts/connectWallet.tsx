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
  const { publicKey } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(publicKey);
  const [init, setInit] = useState(true)
  const [verifyModalVisible, setVerifyModalVisible] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Check if address has been previously authenticated
    if (publicKey && isAddressAuthenticated(publicKey.toString())) {
      setAuthenticated(true);
    }

    // Check if address is whitelisted
    if (publicKey && isAddressWhitelisted(publicKey.toString())) {
      setVerified(true);
    };

    if (publicKey && authenticated === true) {
      if (verified === false) {
        // Do not let user access app
        return setInit(false);
      } else if (verified === true) {
        // Do not show verify modal again
        setVerifyModalVisible(false)
      }
    }
  }, [publicKey, verified, authenticated]);  

  return (
    <ConnectWalletContext.Provider value={{ connecting, setConnecting }}>
      {publicKey && <VerifyModal
        visible={verifyModalVisible}
        onClose={() => setVerifyModalVisible(false)}
        verified={verified}
        authenticated={authenticated}
      />}
      {init && props.children}
    </ConnectWalletContext.Provider>
  );
};

export const useConnectWallet = () => {
  const context = useContext(ConnectWalletContext);
  
  return context;
};