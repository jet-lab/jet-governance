import React from "react";
import { Link } from "react-router-dom";
import { Card } from "antd";

export const ProposalCard = (props: any) => {
  const { active, result, headline, number, end, id } = props;

  const now = new Date().getTime();
  const timeleft = end - now;
  const days = Math.floor(timeleft / (1000 * 60 * 60 * 24));

  return (
    <Link to={`/proposal/${id}/${headline.substring(0, 7)}`}>
      <Card bordered={false}>
      <div>
        <div className="header">Proposal {number}</div>
        <h2>{headline}</h2>
      </div>
      <div className="details">
        <div className={`status ${active ? "active" : result}`}>
          <i className="fas fa-circle"></i>
          {active ? "ACTIVE" : result}
        </div>
        {active ? <div className="end">{days} days left</div> : ""}
      </div>
    </Card>
  </Link>
  );
};
