import {
  SignerWalletAdapter,
  WalletAdapterNetwork,
  WalletError,
  WalletNotConnectedError
} from '@solana/wallet-adapter-base';
import { useWallet, WalletProvider as BaseWalletProvider } from '@solana/wallet-adapter-react';
import {
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolongWallet,
  getMathWallet
} from '@solana/wallet-adapter-wallets';
import { Button, Modal } from 'antd';
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { notify } from '../utils';
import { useConnectionConfig } from './connection';

export type { SignerWalletAdapter, WalletNotConnectedError };

export type WalletSigner = Pick<
  SignerWalletAdapter,
  'publicKey' | 'signTransaction' | 'signAllTransactions'
>;

export interface WalletModalContextState {
  visible: boolean;
  setVisible: (open: boolean) => void;
}

export const WalletModalContext = createContext<WalletModalContextState>(
  {} as WalletModalContextState
);

export function useWalletModal(): WalletModalContextState {
  return useContext(WalletModalContext);
}

export const WalletModal = () => {
  const { wallets, wallet: selected, select } = useWallet();
  const { visible, setVisible } = useWalletModal();
  const close = useCallback(() => setVisible(false), [setVisible]);

  return (
    <Modal
      title="Select Wallet"
      okText="Connect"
      visible={visible}
      footer={null}
      onCancel={close}
      width={400}
    >
      {wallets.map(wallet => {
        return (
          <Button
            key={wallet.name}
            size="large"
            type={wallet === selected ? 'primary' : 'ghost'}
            onClick={() => {
              select(wallet.name);
              close();
            }}
            icon={
              <img
                alt={`${wallet.name}`}
                width={20}
                height={20}
                src={wallet.icon}
                style={{ marginRight: 8 }}
              />
            }
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              marginBottom: 8
            }}
          >
            {wallet.name}
          </Button>
        );
      })}
    </Modal>
  );
};

export const WalletModalProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);

  return (
    <WalletModalContext.Provider
      value={{
        visible,
        setVisible
      }}
    >
      {children}
      <WalletModal />
    </WalletModalContext.Provider>
  );
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { env } = useConnectionConfig();

  const network = useMemo(() => {
    switch (env) {
      case 'mainnet-beta':
        return WalletAdapterNetwork.Mainnet;
      case 'testnet':
        return WalletAdapterNetwork.Testnet;
      case 'devnet':
      case 'localnet':
      default:
        return WalletAdapterNetwork.Devnet;
    }
  }, [env]);

  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSolflareWallet(),
      getSolongWallet(),
      getMathWallet(),
      getSolletWallet({ network })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const onError = useCallback((error: WalletError) => {
    console.error(error);
    notify({
      message: 'Wallet error',
      description: error.message
    });
  }, []);

  return (
    <BaseWalletProvider wallets={wallets} onError={onError} autoConnect>
      <WalletModalProvider>{children}</WalletModalProvider>
    </BaseWalletProvider>
  );
};
