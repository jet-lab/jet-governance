import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "antd";
import { getRemainingTime } from "../utils/utils";

export const ProposalCard = (props: any) => {
  const { active, result, headline, number, end, id } = props;
  const [currentTime, setCurrentTime] = useState(Date.now());

    // Update current time every second
    useEffect(() => {
      const secondInterval = setInterval(() => {
        setCurrentTime(currentTime + 1000);
      }, 1000);
      return () => clearInterval(secondInterval);
    })

  return (
    <Link to={`/proposal/${id}/${headline.substring(0, 7)}`}>
      <Card bordered={false}>
      <div>
        <div className="header">Proposal {number}</div>
        <h2>{headline}</h2>
      </div>
      <div className="details">
          {active ? `Ends in ${getRemainingTime(currentTime, end)}` : ""}
      </div>
    </Card>
  </Link>
  );
};
