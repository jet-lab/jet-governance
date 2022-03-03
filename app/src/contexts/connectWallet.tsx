import { Auth } from '@jet-lab/jet-engine';
import { useProvider } from '@jet-lab/jet-engine/lib/common';
import { useWallet } from '@solana/wallet-adapter-react';
import { createContext, useContext, useState } from 'react';
import { createUserAuth } from '../actions/createUserAuth';
import { VerifyModal } from '../components/modals/VerifyModal';
import { useRpcContext } from '../hooks';
import { useConnection } from './connection';

// Connecting wallet context
interface ConnectWallet {
  connecting: boolean;
  setConnecting: (connecting: boolean) => void;
  welcoming: boolean;
  setWelcoming: (welcoming: boolean) => void;
  setAuthorizationConfirmed: (authorizationConfirmed: boolean) => void;
  resetAuth: () => void;
}
const ConnectWalletContext = createContext<ConnectWallet>({
  connecting: false,
  setConnecting: () => {},
  welcoming: false,
  setWelcoming: () => {},
  setAuthorizationConfirmed: () => {},
  resetAuth: () => {}
});

export const ConnectWalletProvider = (props: { children: any }) => {
  const wallet = useWallet();
  const connection = useConnection();
  const rpcContext = useRpcContext();
  const { publicKey, connected } = wallet;
  const [connecting, setConnecting] = useState(false);
  const [welcoming, setWelcoming] = useState(false);
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState(false);

  const provider = useProvider(connection, wallet);
  const authProgram = Auth.useAuthProgram(provider);
  const { authAccount, loading: authAccountLoading } = Auth.useAuthAccount(
    authProgram,
    wallet.publicKey
  );

  const resetAuth = () => {
    setWelcoming(false);
    setAuthorizationConfirmed(false);
  };

  const connect = (connecting: boolean) => {
    if (connecting) {
      setConnecting(true);
      setWelcoming(true);
      setAuthorizationConfirmed(false);
    } else {
      setConnecting(false);
      setWelcoming(false);
    }
  };

  const createAuthAccount = async () => {
    if (authAccountLoading || authAccount || !authProgram || !publicKey) {
      return true;
    }

    let success = true;
    try {
      await createUserAuth(rpcContext, authProgram, publicKey, publicKey);
    } catch (ex) {
      success = false;
    }
    return success;
  };

  return (
    <ConnectWalletContext.Provider
      value={{
        connecting,
        setConnecting: connect,
        welcoming,
        setWelcoming,
        setAuthorizationConfirmed,
        resetAuth
      }}
    >
      <VerifyModal
        visible={welcoming || (connected && !authorizationConfirmed)}
        authAccount={authAccount}
        authAccountLoading={authAccountLoading}
        createAuthAccount={createAuthAccount}
      />
      {props.children}
    </ConnectWalletContext.Provider>
  );
};

export const useConnectWallet = () => {
  const context = useContext(ConnectWalletContext);

  return context;
};
