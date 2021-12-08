import React, { createContext, useContext, useState } from "react";

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
  const [connecting, setConnecting] = useState(false);
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