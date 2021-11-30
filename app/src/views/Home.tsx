import React, { useState } from "react";
import { useProposal } from "../contexts/proposal";
import { ProposalCard } from "../components/ProposalCard";
import { Button, InputNumber, Divider } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { shortenAddress, formatTokenAmount } from "../utils/utils";
import { user, proposals } from "../hooks/useClient";
import { Input } from "../components/Input";
// import { user, proposals } from "../hooks/jet-client/useClient";

export const HomeView = () => {
  const { connected, publicKey } = useWallet();
  const { showing, setShowing, shownProposals } = useProposal();
  const [inputAmount, setInputAmount] = useState<number | null>(null);

  const inputCheck = (value: number) => {
    if (value && value < 0) {
      value = 0;
    }
  };

  return (
    <div className="content-body">
      <div className="panel">
        <h3>Your Info</h3>

        <div className="neu-inset">
          <h3>Staked Balance</h3>
          <div>
            <span className="text-gradient" id="locked-balance">{connected ? user.jet.locked : 0} JET</span>
          </div>
          <div id="wallet-overview" className="flex justify-between">
            <span>38.5k JET available to unstake. Visit claims for info.</span>
          </div>
          <Divider />
          <div className="flex column">
            <Input type="number" token
                value={inputAmount === null ? '' : inputAmount}
                maxInput={connected ? user.jet.wallet : 0}
                disabled={!connected}
                onChange={(value: number) => setInputAmount(value)}
              submit={() => null}
            />
            <Button type="primary" disabled={!connected}>
              Stake
            </Button>
            <Button type="primary" disabled={!connected}>
              Unstake
            </Button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="flex justify-between header">
          <h3>{showing}</h3>
          <div>
            <span onClick={() => setShowing("active")}>Active</span>
            <span onClick={() => setShowing("inactive")}>Inactive</span>
            <span onClick={() => setShowing("passed")}>Passed</span>
            <span onClick={() => setShowing("rejected")}>Rejected</span>
            <span onClick={() => setShowing("all")}>All</span>
          </div>
        </div>

        <div className="show-proposals">
          {shownProposals.map((proposal: any) => (
            <ProposalCard
              headline={proposal.headline}
              number={proposal.id}
              id={proposal.id}
              active={proposal.active}
              end={proposal.end ?? null}
              result={proposal.result ?? null}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
