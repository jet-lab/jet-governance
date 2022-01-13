import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnectWallet } from "../../contexts/connectWallet";
import { Modal } from "antd";

export function ConnectWalletModal() {
  const { wallets, select, connected, wallet } = useWallet();
  const { connecting, setConnecting } = useConnectWallet();

  return (
    <>
    <Modal footer={null}
      visible={connecting && !connected} 
      onCancel={() => setConnecting(false)}>
      <div className="connect-wallet-modal flex-centered column">
        <img src="img/jet/jet_logo_gradient.png"
          width="120px"
          height="auto" 
          alt="Jet Protocol" 
        />
        <span>
        <strong>Vote</strong>, <strong>earn rewards</strong>, and <strong>check for airdrops</strong> by connecting your wallet.
        </span>
        <div className="divider">
        </div>
        <div className="wallets flex-centered column">
          {wallets.map((w) => (
            <div key={w.name} 
              className={`wallet flex align-center justify-between 
                ${wallet?.name === w.name ? 'active' : ''}`}
              onClick={() => {
                select(w.name);
              }}>
              <div className="flex-centered">
                <img src={`img/wallets/${w.name.toLowerCase()}.png`} 
                  width="30px"
                  height="auto"
                  alt={`${w.name} Logo`}
                />
                <p className="center-text">
                  {w.name}
                </p>
              </div>
              <i className="text-gradient fas fa-arrow-right">
              </i>
            </div>
          ))}
        </div>
      </div>
      </Modal>
    </>
  );
};