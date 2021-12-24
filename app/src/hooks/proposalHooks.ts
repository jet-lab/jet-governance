import BN from "bn.js";
import { useMemo } from "react";
import { ZERO } from "../constants";
import { ParsedAccount } from "../contexts";
import { useProposalContext } from "../contexts/proposal";
import { Proposal, ProposalState, TokenOwnerRecord, VoteRecord } from "../models/accounts";

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

export interface VoterDisplayData {
  name: string;
  title: string;
  group: VoteType;
  value: BN;
}

export enum VoteType {
  Undecided = 'Undecided',
  Yes = 'Yay',
  No = 'Nay',
}

export function useVoterDisplayData(
  voteRecords: ParsedAccount<VoteRecord>[],
  tokenOwnerRecords: ParsedAccount<TokenOwnerRecord>[],
): Array<VoterDisplayData> {
  return useMemo(() => {

    const mapper = (key: string, amount: BN, label: VoteType) => ({
      name: key,
      title: key,
      group: label,
      value: amount,
      key: key,
    });

    const undecidedData = tokenOwnerRecords
      .filter(
        tor =>
          !tor.info.governingTokenDepositAmount.isZero() &&
          !voteRecords.some(
            vt =>
              vt.info.governingTokenOwner.toBase58() ===
              tor.info.governingTokenOwner.toBase58(),
          ),
      )
      .map(tor =>
        mapper(
          tor.info.governingTokenOwner.toBase58(),
          tor.info.governingTokenDepositAmount,
          VoteType.Undecided,
        ),
      );

    const noVoteData = voteRecords
      .filter(vr => vr.info.getNoVoteWeight()?.gt(ZERO))
      .map(vr =>
        mapper(
          vr.info.governingTokenOwner.toBase58(),
          vr.info.getNoVoteWeight()!,
          VoteType.No,
        ),
      );

    const yesVoteData = voteRecords
      .filter(vr => vr.info.getYesVoteWeight()?.gt(ZERO))
      .map(vr =>
        mapper(
          vr.info.governingTokenOwner.toBase58(),
          vr.info.getYesVoteWeight()!,
          VoteType.Yes,
        ),
      );

    const data = [...undecidedData, ...yesVoteData, ...noVoteData].sort((a, b) =>
      b.value.cmp(a.value),
    );

    return data;
  }, [voteRecords, tokenOwnerRecords])
}