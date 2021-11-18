import { WalletMultiButton } from "@solana/wallet-adapter-ant-design";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TokenIcon } from "../components/TokenIcon";
import { useConnectionConfig } from "../contexts/connection";
import { useMarkets } from "../contexts/market";
import { useUserBalance, useUserTotalBalance } from "../hooks";
import { WRAPPED_SOL_MINT, JET_TOKEN_MINT } from "../utils/ids";
import { ProposalCard } from "../components/ProposalCard";
import { formatUSD } from "../utils/utils";
import { Button, InputNumber, Divider } from "antd";
import { ProposalState } from "../models/INITIAL_PROPOSALS";

export const HomeView = (props: { proposals: ProposalState[]}) => {
  const [showing, setShowing] = useState("active");

  const { marketEmitter, midPriceInUSD } = useMarkets();
  const { tokenMap } = useConnectionConfig();
  const SRM_ADDRESS = "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt";
  const SRM = useUserBalance(SRM_ADDRESS);
  const SOL = useUserBalance(WRAPPED_SOL_MINT);
  const JET = useUserBalance(JET_TOKEN_MINT);
  const { balanceInUSD: totalBalanceInUSD } = useUserTotalBalance();

  const { proposals } = props;
  let shownProposals: ProposalState[] = proposals;

  if (showing === "active") {
    shownProposals = proposals.filter((p) => p.active);
  } else if (showing === "inactive") {
    shownProposals = proposals.filter((p) => !p.active && p.result === "inactive");
  } else if (showing === "passed") {
    shownProposals = proposals.filter((p) => !p.active && p.result === "passed");
  } else if (showing === "rejected") {
    shownProposals = proposals.filter((p) => !p.active && p.result === "rejected");
  } else if (showing === "all") {
    shownProposals = proposals;
  }


  useEffect(() => {
    const refreshTotal = () => {};

    const dispose = marketEmitter.onMarket(() => {
      refreshTotal();
    });

    refreshTotal();

    return () => {
      dispose();
    };
  }, [marketEmitter, midPriceInUSD, tokenMap]);

  const inputCheck = (value: number) => {
    if (value && value < 0) {
      value = 0;
    }
  }
  
  return (
    <div className="content-body">
      <div className="panel">
        <h3>Your Info</h3>
        <div className="stake-info">
          Locked Balance
          <Divider />
          Lock
          <InputNumber min={0} />
          <Button>Lock</Button>
          <Button>Unlock</Button>
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
