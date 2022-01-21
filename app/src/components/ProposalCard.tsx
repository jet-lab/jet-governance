import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Progress } from "antd";
import { Governance, Proposal, ProposalState } from "../models/accounts";
import { ParsedAccount } from "../contexts";
import { getProposalUrl } from "../tools/routeTools";
import { useCountdown } from "../hooks/proposalHooks";
import { getPubkeyIndex } from "../models/PUBKEYS_INDEX";

export const ProposalCard = ({
  proposal: {
    info: proposal,
    pubkey: proposalAddress,
    info: { name: headline }
  },
  governance: {
    info: governance
  }
}: { proposal: ParsedAccount<Proposal>, governance: ParsedAccount<Governance> }) => {

  var headlineUrl = useMemo(() => getProposalUrl(
    proposalAddress,
    headline.substring(0, 15).replace(" ", "-")),
    [proposalAddress, headline])
  const proposalStr = useMemo(() => proposalAddress.toString(), [proposalAddress])

  // Active votes show progress bar
  const { yesPercent, yesAbstainPercent } = proposal.getVoteCounts();
  const { endDate } = useCountdown(proposal, governance);

  return (
    <Link to={headlineUrl}>
      <Card
        bordered={false}
        className={`proposal-card clickable ${proposal.isVoting() ? "" : ""}`}
        style={{}}>
        <div>
          <div className="header">JUMP {getPubkeyIndex(proposalStr)} </div>
          <h1>{headline}</h1>
        </div>
        <div className="details">
          {!proposal.isPreVotingState() ?
            <>
              {proposal.isVoting() ? `Ends: ${endDate}` : "Voting ended"}
              <Progress
                  percent={yesAbstainPercent}
                  success={{ percent: yesPercent }}
                  showInfo={false}
                  key={proposalAddress.toBase58()} />
            </> :
            ProposalState[proposal.state]
          }
        </div>
      </Card>
    </Link>
  );
};
