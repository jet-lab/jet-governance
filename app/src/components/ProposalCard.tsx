import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Progress } from "antd";
import { getRemainingTime } from "../utils/utils";
import { ProposalState } from "../models/INITIAL_PROPOSALS";

export const ProposalCard = (props: { proposal: ProposalState }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { proposal } = props;
  const { result, headline, end, id, inFavor, against, abstain } = proposal;

  // Truncate headline if too long
  var headlineTruncated = headline.substr(0, 25) + "\u2026";

  // Update current time every second
  useEffect(() => {
    const secondInterval = setInterval(() => {
      setCurrentTime(currentTime + 1000);
    }, 1000);
    return () => clearInterval(secondInterval);
  });

  const active = end.getTime() > Date.now();

  // Active votes show progress bar
  const total = inFavor + against + abstain
  const inFavorProgress = inFavor / total * 100
  const abstainProgress = (abstain + inFavor) / total * 100

  return (
    <Link to={`/proposal/${id}/${headline.substring(0, 7)}`}>
      <Card bordered={false} className="proposal-card">
        <div>
          <div className="header">Proposal {id}</div>
          <h1>{headline.length > 25 ? headlineTruncated : headline}</h1>
        </div>
        <div className="details">
          {active ? (`Ends in ${getRemainingTime(currentTime, end.valueOf())}`) : ""}
          {active ? (<Progress
            percent={abstainProgress}
            success={{ percent: inFavorProgress }}
            showInfo={false} />) : ""}
          
        </div>
      </Card>
    </Link>
  );
};
