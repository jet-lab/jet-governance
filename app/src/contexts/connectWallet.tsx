import { createContext, useContext, useState } from "react";
import { VerifyModal } from "../components/modals/VerifyModal";

// Connecting wallet context
interface ConnectWallet {
  connecting: boolean;
  setConnecting: (connecting: boolean) => void;
}
const ConnectWalletContext = createContext<ConnectWallet>({
  connecting: false,
  setConnecting: () => {}
});

export const ConnectWalletProvider = (props: { children: any }) => {
  const [connecting, setConnecting] = useState(false);

  const connect = (connecting: boolean) => {
    setConnecting(connecting);
  };

  return (
    <ConnectWalletContext.Provider
      value={{
        connecting,
        setConnecting: connect
      }}
    >
      {connecting && <VerifyModal />}
      {props.children}
    </ConnectWalletContext.Provider>
  );
};

export const useConnectWallet = () => {
  return useContext(ConnectWalletContext);
};
