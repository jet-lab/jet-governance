import { useMemo } from "react";
import { ParsedAccount } from "../contexts";
import { useProposalContext } from "../contexts/proposal";
import { Proposal, ProposalState } from "../models/accounts";

export const useProposalFilters = (proposals: ParsedAccount<Proposal>[]) => {
  const { showing } = useProposalContext();

  return useMemo(() => {
    if (showing === "active") {
      return proposals.filter((p) => !p.info.isVoteFinalized() || p.info.state === ProposalState.Draft);
    } else if (showing === "inactive") {
      return proposals.filter((p) => p.info.isVoteFinalized());
    } else if (showing === "passed") {
      return proposals.filter((p) => p.info.state === ProposalState.Succeeded);
    } else if (showing === "rejected") {
      return proposals.filter((p) => p.info.state === ProposalState.Defeated);
    } else if (showing === "all") {
      return proposals;
    } else {
      return proposals;
    }
  }, [showing, proposals]);
}