import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Progress } from "antd";
import { shortenAddress } from "../utils";
import { Governance, Proposal, ProposalState } from "../models/accounts";
import { ParsedAccount } from "../contexts";
import { getProposalUrl } from "../tools/routeTools";
import { useRpcContext } from "../hooks/useRpcContext";
import { useCountdown } from "../hooks/proposalHooks";

export const ProposalCard = (props: { proposal: ParsedAccount<Proposal>, governance: ParsedAccount<Governance> }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const {
    proposal: {
      info: proposal,
      pubkey: proposalAddress,
      info: { name: headline }
    },
    governance: {
      info: governance
    }
  } = props;

  const { programId } = useRpcContext();

  // Truncate headline if too long
  // var shortHeadline = useMemo(() => headline.length < 25 ? headline : headline.substr(0, 25) + "…", [headline]);
  var headlineUrl = useMemo(() => getProposalUrl(
    proposalAddress,
    programId,
    headline.substring(0, 15).replace(" ", "-")),
    [proposalAddress, programId, headline])
  const proposalAddressStr = useMemo(() => shortenAddress(proposalAddress.toString()), [proposalAddress])

  // Update current time every second
  useEffect(() => {
    const secondInterval = setInterval(() => {
      setCurrentTime(currentTime + 1000);
    }, 1000);
    return () => clearInterval(secondInterval);
  });

  // Active votes show progress bar
  const { yesPercent, yesAbstainPercent } = proposal.getVoteCounts();
  const { countdown } = useCountdown(proposal, governance);

  return (
    <Link to={headlineUrl}>
      <Card
        bordered={false}
        className={`proposal-card clickable ${proposal.isVoting() ? "" : ""}`}
        style={{}}>
        <div>
          <div className="header">Proposal {proposalAddressStr}</div>
          <h1>{headline}</h1>
        </div>
        <div className="details">
          {!proposal.isPreVotingState() ?
            <>
              {proposal.isVoting() ? `Ends in ${countdown}` : "Voting ended"}
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
