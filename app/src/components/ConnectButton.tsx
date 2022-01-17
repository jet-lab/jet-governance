import React, { FunctionComponent, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnectWallet } from "../contexts/connectWallet";
import { Button } from "antd";
import { shortenAddress } from "../utils";

export const ConnectButton: FunctionComponent = () => {
  const { connected, publicKey, disconnect } = useWallet();
  const { setConnecting } = useConnectWallet();

  // Dynamic connection properties for the button
  const connectButtonTitle = useMemo(() => 
    connected ? "Disconnect" : "Connect",
    [connected]
  );
  const connectButtonClasses = useMemo(() =>
    `connect-btn flex-centered ${connected ? '' : 'small-btn'}`,
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
      type="ghost"
      title={connectButtonTitle}
      onClick={() => connected ? disconnect() : setConnecting(true)}>
      {connectButtonText}
    </Button>
  );
};
