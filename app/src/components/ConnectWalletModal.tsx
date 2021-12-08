import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnectWallet } from "../contexts/connectWallet";

export function ConnectWalletModal(props: {
  headline?: string
}) {
  const { wallets, select, connected } = useWallet();
  const { connecting, setConnecting } = useConnectWallet();
  const [walletChoice, setWalletChoice] = useState('');

  if (connecting && !connected) {
    return (
      <div className="connect-wallet-modal">
        <div className="modal-bg"
          onClick={() => setConnecting(false)}>
        </div>
        <div className="modal flex-centered column">
          <img src="img/jet/jet_logo_gradient.png"
            width="120px"
            height="auto" 
            alt="Jet Protocol" 
          />
          <span>
            {props.headline}
          </span>
          <div className="ant-divider">
          </div>
          <div className="wallets flex-centered column">
            {wallets.map((wallet) => (
              <div key={wallet.name} 
                className={`wallet flex align-center justify-between 
                  ${walletChoice === wallet.name ? 'active' : ''}`}
                onClick={() => {
                  setWalletChoice(wallet.name);
                  select(wallet.name);
                }}>
                <div className="flex-centered">
                  <img src={`img/wallets/${wallet.name.toLowerCase()}.png`} 
                    width="30px"
                    height="auto"
                    alt={`${wallet.name} Logo`}
                  />
                  <p className="center-text">
                    {wallet.name}
                  </p>
                </div>
                <i className="text-gradient jet-icons">
                  ➜
                </i>
              </div>
            ))}
          </div>
          <i className="jet-icons close"
            onClick={() => setConnecting(false)}>
            ✕
          </i>
        </div>
      </div>
    );
  } else {
    return <></>
  }
};