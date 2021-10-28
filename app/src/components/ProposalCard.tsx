import React from "react";

export const ProposalCard = (props: any) => {
  const { active, result, headline, number, end } = props;

  const now = new Date().getTime();
  const timeleft = end - now;
  const days = Math.floor(timeleft / (1000 * 60 * 60 * 24));



  return (
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
  );
};
