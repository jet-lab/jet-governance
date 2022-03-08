import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import { WalletProvider as BaseWalletProvider } from "@solana/wallet-adapter-react";
import {
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolongWallet,
  getMathWallet
} from "@solana/wallet-adapter-wallets";
import { useCallback, useMemo } from "react";
import { notify } from "../utils";
import { useConnectionConfig } from "./connection";

export const WalletProvider = ({ children }: { children: any }) => {
  const { env } = useConnectionConfig();

  const network = useMemo(() => {
    switch (env) {
      case "mainnet-beta":
        return WalletAdapterNetwork.Mainnet;
      case "testnet":
        return WalletAdapterNetwork.Testnet;
      case "devnet":
      case "localnet":
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
      message: "Wallet error",
      description: error.message
    });
  }, []);

  return (
    <BaseWalletProvider wallets={wallets} onError={onError} autoConnect>
      {children}
    </BaseWalletProvider>
  );
};
