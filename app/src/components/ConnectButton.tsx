import React, { FunctionComponent, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { shortenAddress } from "../utils/utils";
import { useConnectWallet } from "../contexts/connectWallet";
import { Button } from "antd";

export const ConnectButton: FunctionComponent = () => {
  const { connected, wallet, publicKey, disconnect } = useWallet();
  const { setConnecting } = useConnectWallet();

  // Dynamic connection properties for the button
  const connectButtonTitle = useMemo(() => 
    connected ? "Disconnect" : "Connect",
    [connected]
  );
  const connectButtonClasses = useMemo(() =>
    `connect-btn flex-centered ${connected ? '' : 'small-btn bicyclette'}`,
    [connected]
  );
  const connectButtonText = useMemo(() => 
    publicKey 
      ? `${shortenAddress(publicKey.toString())} Connected` 
        : "Connect Wallet",
    [publicKey]
  );

  return (
    <Button className={connectButtonClasses}
      type="dashed"
      title={connectButtonTitle}
      onClick={() => connected ? disconnect() : setConnecting(true)}>
      {connectButtonText}
    </Button>
  );
};
