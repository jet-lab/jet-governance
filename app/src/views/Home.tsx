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

export const HomeView = (props: {
  allProposals: ProposalState[],
  activeProposals: ProposalState[],
  inactiveProposals: ProposalState[],
  passedProposals: ProposalState[],
  rejectedProposals: ProposalState[] }) => {
  const [showing, setShowing] = useState("active");
  const [shownProposals, setShownProposals] = useState(props.allProposals);

  const { allProposals, activeProposals, inactiveProposals, passedProposals, rejectedProposals } = props;

  if (showing === "active") {
    setShownProposals(activeProposals);
  } else if (showing === "inactive") {
    setShownProposals(inactiveProposals);
  } else if (showing === "passed") {
    setShownProposals(passedProposals);
  } else if (showing === "rejected") {
    setShownProposals(rejectedProposals);
  } else if (showing === "all") {
    setShownProposals(allProposals);
  }

  const { marketEmitter, midPriceInUSD } = useMarkets();
  const { tokenMap } = useConnectionConfig();
  const SRM_ADDRESS = "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt";
  const SRM = useUserBalance(SRM_ADDRESS);
  const SOL = useUserBalance(WRAPPED_SOL_MINT);
  const JET = useUserBalance(JET_TOKEN_MINT);
  const { balanceInUSD: totalBalanceInUSD } = useUserTotalBalance();


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
