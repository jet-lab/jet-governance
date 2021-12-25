import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Progress } from "antd";
import { getRemainingTime, shortenAddress } from "../utils";
import { Governance, Proposal } from "../models/accounts";
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
  var shortHeadline = useMemo(() => headline.length < 25 ? headline : headline.substr(0, 25) + "…", [headline]);
  var headlineUrl = useMemo(() => getProposalUrl(
    proposalAddress,
    programId,
    headline.substring(0, 15).replace(" ", "-")),
    [proposalAddress, programId, headline])
  const proposalAddressStr = useMemo(() => shortenAddress(proposalAddress), [proposalAddress])

  // Update current time every second
  useEffect(() => {
    const secondInterval = setInterval(() => {
      setCurrentTime(currentTime + 1000);
    }, 1000);
    return () => clearInterval(secondInterval);
  });

  // Active votes show progress bar
  const { yesPercent, yesAbstainPercent } = proposal.getVoteCounts();
  const { startDate, endDate, countdown } = useCountdown(proposal, governance);

  return (
    <Link to={headlineUrl}>
      <Card
        bordered={false}
        className="proposal-card"
        style={{}}>
        <div>
          <div className="header">Proposal {proposalAddressStr}</div>
          <h1>{shortHeadline}</h1>
        </div>
        <div className="details">
          {proposal.isVoting() &&
            <>
              Ends in {countdown}
              <Progress
                  percent={yesAbstainPercent}
                  success={{ percent: yesPercent }}
                  showInfo={false}
                  key={proposalAddress.toBase58()} />
            </>
          }
        </div>
      </Card>
    </Link>
  );
};
