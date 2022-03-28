import { Governance, ProgramAccount, Proposal } from "@solana/spl-governance";
import { Link } from "react-router-dom";
import { useCountdown } from "../../hooks";
import { getPubkeyIndex } from "../../models/PUBKEYS_INDEX";
import { getProposalUrl } from "../../tools/routeTools";

export const VoteOnOtherProposal = ({
  proposal,
  governance,
  onClose
}: {
  proposal: ProgramAccount<Proposal>;
  governance: ProgramAccount<Governance>;
  onClose: () => void;
}) => {
  const headlineUrl = getProposalUrl(
    proposal.pubkey,
    proposal.account.name.substring(0, 15).replace(" ", "-")
  );
  const { endDateOrCountdown } = useCountdown(proposal, governance);

  return (
    <div key={proposal.pubkey.toBase58()}>
      <p>
        <Link to={headlineUrl} onClick={onClose}>
          <u>JUMP-{getPubkeyIndex(proposal.pubkey.toBase58())}</u>
        </Link>
        : {proposal.account.name}. <span className="secondary-text">{endDateOrCountdown}</span>
      </p>
    </div>
  );
};
