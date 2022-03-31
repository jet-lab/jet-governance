import { Governance, ProgramAccount, Proposal, ProposalState } from "@solana/spl-governance";
import { Card, Progress } from "antd";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { getVoteCounts, useCountdown } from "../hooks";
import { getPubkeyIndex } from "../models/PUBKEYS_INDEX";
import { getProposalUrl } from "../tools/routeTools";

export const ProposalCard = ({
  proposal,
  governance
}: {
  proposal: ProgramAccount<Proposal>;
  governance: ProgramAccount<Governance>;
}) => {
  var headlineUrl = useMemo(
    () => getProposalUrl(proposal.pubkey, proposal.account.name.substring(0, 15).replace(" ", "-")),
    [proposal.pubkey, proposal.account.name]
  );
  const proposalStr = useMemo(() => proposal.pubkey.toString(), [proposal.pubkey]);

  // Active votes show progress bar
  const { yesPercent, yesAbstainPercent } = getVoteCounts(proposal);
  const { endDateOrCountdown } = useCountdown(proposal, governance);

  return (
    <Link to={headlineUrl}>
      <Card bordered={false} className={`proposal-card clickable`} style={{}}>
        <div>
          <div className="header">JUMP-{getPubkeyIndex(proposalStr)} </div>
          <h1>{proposal.account.name}</h1>
        </div>
        <div className="details">
          {!proposal.account.isPreVotingState() && !!endDateOrCountdown ? (
            <>
              {endDateOrCountdown}

              <Progress
                percent={yesAbstainPercent}
                success={{ percent: yesPercent }}
                showInfo={false}
                key={proposal.pubkey.toBase58()}
              />
            </>
          ) : (
            ProposalState[proposal.account.state]
          )}
        </div>
      </Card>
    </Link>
  );
};
