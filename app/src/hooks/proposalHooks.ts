import { Airdrop, AirdropTarget } from "@jet-lab/jet-engine";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useMemo, useState } from "react";
import { ZERO } from "../constants";
import { ParsedAccount } from "../contexts";
import { useProposalContext } from "../contexts/proposal";
import {
  Governance,
  Proposal,
  ProposalState,
  TokenOwnerRecord,
  VoteRecord,
} from "../models/accounts";
import { dateToString } from "../utils";

export const useProposalFilters = (proposals: ParsedAccount<Proposal>[]) => {
  const { proposalFilter } = useProposalContext();

  return useMemo(() => {
    if (proposalFilter === "active") {
      return proposals.filter((p) => p.info.isVoting());
    } else if (proposalFilter === "inactive") {
      return proposals.filter(
        (p) => p.info.isVoteFinalized() || p.info.isPreVotingState()
      );
    } else if (proposalFilter === "passed") {
      return proposals.filter((p) => p.info.state === ProposalState.Succeeded);
    } else if (proposalFilter === "rejected") {
      return proposals.filter((p) => p.info.state === ProposalState.Defeated);
    } else if (proposalFilter === "all") {
      return proposals;
    } else {
      return proposals;
    }
  }, [proposalFilter, proposals]);
};

export function useCountdown(proposal: Proposal, governance: Governance) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  const zeroPad = (num: number, places: number) => {
    return String(num).padStart(places, "0");
  }

  const countdown = () => {

    return "TEST"
    // return getRemainingTime(currentTime, proposal.getVotingDeadline(governance)?.toNumber())
  }

  const startDate = useMemo(
    () =>
      proposal.votingAt
        ? dateToString(new Date(proposal.votingAt.toNumber() * 1000))
        : undefined,
    [proposal.votingAt]
  );
  const endDate = useMemo(() => {
    const deadline = proposal.getVotingDeadline(governance);
    return deadline
      ? dateToString(new Date(deadline.toNumber() * 1000))
      : undefined;
  }, [proposal, governance]);

  return { startDate, endDate, countdown };
}

export interface VoterDisplayData {
  name: string;
  title: string;
  group: VoteType;
  value: BN;
}

export enum VoteType {
  Undecided = "Undecided",
  Yes = "Approve",
  No = "Reject",
  Abstain = "Abstain",
}

interface VoterData {
  yesVote: Array<VoterDisplayData>;
  noVote: Array<VoterDisplayData>;
  // abstainVote: Array<VoterDisplayData>,
  allHasVoted: Array<VoterDisplayData>;
  undecidedVote: Array<VoterDisplayData>;
  allData: Array<VoterDisplayData>;
}

export function useVoterDisplayData(
  voteRecords: ParsedAccount<VoteRecord>[],
  tokenOwnerRecords: ParsedAccount<TokenOwnerRecord>[]
): VoterData {
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
        (tor) =>
          !tor.info.governingTokenDepositAmount.isZero() &&
          !voteRecords.some(
            (vt) =>
              vt.info.governingTokenOwner.toBase58() ===
              tor.info.governingTokenOwner.toBase58()
          )
      )
      .map((tor) =>
        mapper(
          tor.info.governingTokenOwner.toBase58(),
          tor.info.governingTokenDepositAmount,
          VoteType.Undecided
        )
      );

    const allVotesData = voteRecords
      .filter((vr) => vr.info.getYesVoteWeight()?.gt(ZERO))
      .map((vr) =>
        mapper(
          vr.info.governingTokenOwner.toBase58(),
          vr.info.getYesVoteWeight()!,
          VoteType.Yes || VoteType.No || VoteType.Abstain
        )
      );

    const yesVoteData = voteRecords
      .filter((vr) => vr.info.getYesVoteWeight()?.gt(ZERO))
      .map((vr) =>
        mapper(
          vr.info.governingTokenOwner.toBase58(),
          vr.info.getYesVoteWeight()!,
          VoteType.Yes
        )
      );

    const noVoteData = voteRecords
      .filter((vr) => vr.info.getNoVoteWeight()?.gt(ZERO))
      .map((vr) =>
        mapper(
          vr.info.governingTokenOwner.toBase58(),
          vr.info.getNoVoteWeight()!,
          VoteType.No
        )
      );

    // const abstainVoteData = voteRecords
    //   .filter(vr => vr.info.getNoVoteWeight()?.gt(ZERO))
    //   .map(vr =>
    //     mapper(
    //       vr.info.governingTokenOwner.toBase58(),
    //       vr.info.getAbstainVoteWeight()!,
    //       VoteType.Abstain,
    //     ),
    //   );

    const data = [...undecidedData, ...yesVoteData, ...noVoteData].sort(
      (a, b) => b.value.cmp(a.value)
    );

    return {
      yesVote: yesVoteData,
      noVote: noVoteData,
      allHasVoted: [...yesVoteData, ...noVoteData],
      undecidedVote: undecidedData,
      allData: data
    };
  }, [voteRecords, tokenOwnerRecords]);
}

export function useAirdropsByWallet(airdrops: Airdrop[] | undefined, wallet: PublicKey | undefined) {
  return useMemo(() => {
    if (!airdrops || !wallet) {
      return undefined
    }

    return (airdrops
      .map(airdrop => airdrop.getRecipient(wallet))
      .filter(recipient => !!recipient) as AirdropTarget[])
      .sort((a,b) => a?.amount.gt(b?.amount) ? -1 : 1)
  }, [airdrops, wallet])
}

export function useClaimsCount(airdrops: AirdropTarget[] | undefined) {
  return useMemo(() => {
    if(!airdrops) {
      return 0;
    }
    let claims = 0;
    for (let i = 0; i < airdrops.length; i++) {
      const airdrop = airdrops[i];
      if(airdrop.amount.gtn(0)){
        claims++;
      }
    }
    return claims;
  },[airdrops])
}

export function useWithdrawVotesAbility(tokenOwnerRecord: ParsedAccount<TokenOwnerRecord> | undefined) {
  return tokenOwnerRecord?.info.outstandingProposalCount === 0;
}