import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, Divider } from "antd";
import { getProposalUrl } from "../tools/routeTools";
import { getPubkeyIndex } from "../models/PUBKEYS_INDEX";
import { ProgramAccount, Proposal, ProposalState } from "@solana/spl-governance";
import { ReactComponent as ArrowRight } from "../images/arrow_right.svg";

export const PastProposalCard = ({ proposal }: { proposal: ProgramAccount<Proposal> }) => {
  var headlineUrl = useMemo(
    () => getProposalUrl(proposal.pubkey, proposal.account.name.substring(0, 15).replace(" ", "-")),
    [proposal.pubkey, proposal.account.name]
  );
  const proposalStr = useMemo(() => proposal.pubkey.toString(), [proposal.pubkey]);

  let statusColor = "#949494";
  if (ProposalState[proposal.account.state] === "Draft") {
    statusColor = "#3d9e83";
  } else if (ProposalState[proposal.account.state] === "Defeated") {
    statusColor = "#ec6a69";
  } else if (ProposalState[proposal.account.state] === "Succeeded") {
    statusColor = "#3d9e83";
  }

  return (
    <Link to={headlineUrl}>
      <Card bordered={false} className={`past-proposal-card clickable`} style={{}}>
        <div>
          <div className="header">JUMP-{getPubkeyIndex(proposalStr)} </div>
          <div className="details">
            <div style={{ background: statusColor }}>{ProposalState[proposal.account.state]}</div>
          </div>
          <h1>{proposal.account.name}</h1>
          <div className="arrow">
            <ArrowRight />
          </div>
        </div>
      </Card>
      <Divider />
    </Link>
  );
};
