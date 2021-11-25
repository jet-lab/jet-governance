import React from "react";
import { useProposal } from "../contexts/proposal";
import { useUserBalance, useUserTotalBalance } from "../hooks";
import { WRAPPED_SOL_MINT, JET_TOKEN_MINT } from "../utils/ids";
import { ProposalCard } from "../components/ProposalCard";
import { Button, InputNumber, Divider } from "antd";

export const HomeView = () => {
  const { showing, setShowing, shownProposals } = useProposal();
  const { balanceInUSD: totalBalanceInUSD } = useUserTotalBalance();

  const inputCheck = (value: number) => {
    if (value && value < 0) {
      value = 0;
    }
  }
  
  return (
    <div className="content-body">
      <div className="panel">
        <h3>Your Info</h3>
        <div className="neu-inset">
          Locked Balance
          <Divider />
          Lock
          <InputNumber min={0} />
          <Button type="primary">Lock</Button>
          <Button type="primary">Unlock</Button>
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
