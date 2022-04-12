import { Auth } from "@jet-lab/jet-engine";
import { useWallet } from "@solana/wallet-adapter-react";
import { createContext, useContext, useState } from "react";
import { VerifyModal } from "../components/modals";
import { useConnection } from "../contexts";
import { useProvider } from "../hooks";

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

  const { connected, publicKey } = useWallet();
  const provider = useProvider();
  const authProgram = Auth.useAuthProgram(provider);
  const { authAccount } = Auth.useAuthAccount(authProgram, publicKey);
  const authed = authAccount?.userAuthentication.allowed;

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
      {(connecting || (connected && !authed)) && <VerifyModal />}
      {props.children}
    </ConnectWalletContext.Provider>
  );
};

export const useConnectWallet = () => {
  return useContext(ConnectWalletContext);
};
