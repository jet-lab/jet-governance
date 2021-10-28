import React from "react";
import { Link } from "react-router-dom";

export const ProposalCard = (props: any) => {
  const { active, result, headline, number, end, id } = props;

  const now = new Date().getTime();
  const timeleft = end - now;
  const days = Math.floor(timeleft / (1000 * 60 * 60 * 24));

  return (
    <Link to={`/proposal/${id}/${headline.substring(0,7)}`}>
    <div className={`proposal-card ${active ? "active" : "default"}`}>
      <div>
        <div className="header">Proposal {number}</div>
        <div className="headline">{headline}</div>
      </div>
      <div className="details">
        <div className={`status ${active ? "active" : result}`}>
          <i className="fas fa-circle"></i>
          {active ? "ACTIVE" : result}
        </div>
        {active ? <div className="end">{days} days left</div> : ""}
      </div>
    </div>
  </Link>
  );
};
