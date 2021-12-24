import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Progress } from "antd";
import { getRemainingTime } from "../utils";
import { Proposal } from "../models/accounts";
import { ParsedAccount } from "../contexts";
import { getProposalUrl } from "../tools/routeTools";
import { useRpcContext } from "../hooks/useRpcContext";

export const ProposalCard = (props: { proposal: ParsedAccount<Proposal> }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const {
    info: proposal,
    pubkey: proposalAddress,
    info: { name: headline }
  } = props.proposal;

  const { programId } = useRpcContext();
  const { end } = { end: new Date() }; // FIXME

  // Truncate headline if too long
  var headlineTruncated = useMemo(() => headline.substr(0, 25) + "…", [headline]);
  var headlineUrl = useMemo(() => getProposalUrl(
    proposalAddress,
    programId,
    headline.substring(0, 15).replace(" ", "-")),
    [proposalAddress, programId, headline])
  const proposalAddressStr = useMemo(() => proposalAddress.toBase58(), [proposalAddress])

  // Update current time every second
  useEffect(() => {
    const secondInterval = setInterval(() => {
      setCurrentTime(currentTime + 1000);
    }, 1000);
    return () => clearInterval(secondInterval);
  });

  const active = end.getTime() > Date.now();

  // Active votes show progress bar
  const { yesPercent, yesAbstainPercent } = proposal.getVoteCounts();

  return (
    <Link to={headlineUrl}>
      <Card bordered={false} className="proposal-card">
        <div>
          <div className="header">Proposal {proposalAddressStr}</div>
          <h1>{headline.length > 25 ? headlineTruncated : headline}</h1>
        </div>
        <div className="details">
          {active ? (`Ends in ${getRemainingTime(currentTime, end.valueOf())}`) : ""}
          {active ? (<Progress
            percent={yesAbstainPercent}
            success={{ percent: yesPercent }}
            showInfo={false} />) : ""}

        </div>
      </Card>
    </Link>
  );
};
