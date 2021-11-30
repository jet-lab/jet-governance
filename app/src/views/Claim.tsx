import React, { useState } from "react";
import { useProposal } from "../contexts/proposal";
import { Button, Divider, Progress } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { shortenAddress, formatTokenAmount } from "../utils/utils";
import { user } from "../hooks/useClient";
import { Input } from "../components/Input";
// import { user, proposals } from "../hooks/jet-client/useClient";

export const ClaimView = () => {
  const { connected, publicKey } = useWallet();
  const { showing, setShowing, shownProposals } = useProposal();
  const [inputAmount, setInputAmount] = useState<number | null>(null);

  const inputCheck = (value: number) => {
    if (value && value < 0) {
      value = 0;
    }
  };

  return (
    <div className="content-body" id="claim">
      <div className="panel">
        <h3>Airdrop claim</h3>
        <div className="neu-container">
          <h2>Claim your community airdrop here.</h2>
          <p>3000 tokens available for each user. Airdrop must be claimed here.</p>

          <Button type="primary" disabled={!connected}>
            Claim
          </Button>
        </div>
      </div>

      <div className="panel">
        <h3>Current status</h3>
        <div className="flex justify-between header">
          <div className="neu-container">
          <h2>Here's how your airdrop works.</h2>
            <Input
              type="number"
              token
              value={inputAmount === null ? "" : inputAmount}
              maxInput={connected ? user.jet.wallet : 0}
              disabled={!connected}
              onChange={(value: number) => setInputAmount(value)}
              submit={() => null}
            />
            <Button type="primary" disabled={!connected}>
              Unlock
            </Button>
            <Divider />
            <Progress />
          </div>
        </div>
      </div>
    </div>
  );
};
