import { Auth } from "@jet-lab/jet-engine";
import { useProvider } from "@jet-lab/jet-engine/lib/common";
import { useWallet } from "@solana/wallet-adapter-react";
import { createContext, useContext, useState } from "react";
import { createUserAuth } from "../actions/createUserAuth";
import { VerifyModal } from "../components/modals/VerifyModal";
import { useRpcContext } from "../hooks";
import { useConnection } from "./connection";

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
  const wallet = useWallet();
  const connection = useConnection();
  const rpcContext = useRpcContext();
  const { publicKey } = useWallet();
  const [connecting, setConnecting] = useState(false);

  const provider = useProvider(connection, wallet);
  const authProgram = Auth.useAuthProgram(provider);
  const { authAccount, loading: authAccountLoading } = Auth.useAuthAccount(
    authProgram,
    wallet.publicKey
  );

  const connect = (connecting: boolean) => {
    setConnecting(connecting);
  };

  const createAuthAccount = async () => {
    if (authAccountLoading || authAccount || !authProgram || !publicKey) {
      return true;
    }

    let success = true;
    try {
      await createUserAuth(rpcContext, authProgram, publicKey, publicKey);
    } catch (err) {
      console.log(err)
      success = false;
    }
    return success;
  };

  return (
    <ConnectWalletContext.Provider
      value={{
        connecting,
        setConnecting: connect
      }}
    >
      {connecting && (
        <VerifyModal
          authAccount={authAccount}
          authAccountLoading={authAccountLoading}
          createAuthAccount={createAuthAccount}
        />
      )}
      {props.children}
    </ConnectWalletContext.Provider>
  );
};

export const useConnectWallet = () => {
  return useContext(ConnectWalletContext);
};
