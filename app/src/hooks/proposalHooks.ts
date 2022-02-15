import { Airdrop, AirdropTarget } from "@jet-lab/jet-engine";
import { Governance, ProgramAccount, Proposal, ProposalState, pubkeyFilter, TokenOwnerRecord, VoteKind, VoteRecord } from "@solana/spl-governance";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useMemo, useState } from "react";
import { ZERO } from "../constants";
import { ProposalFilter, useProposalContext } from "../contexts/proposal";
import { bnToIntLossy } from "../tools/units";
import { dateToString } from "../utils";
import { useGovernanceAccounts } from "./accountHooks";
import { useRpcContext } from "./useRpcContext";

export function useBN(number: number | undefined, exponent: number | null | undefined = null) {
  return useMemo(() => {
    if (number === undefined) {
      return new BN(0)
    } else if (exponent === undefined) {
      return new BN(0)
    } else if (exponent === null) {
      return new BN(number.toLocaleString(undefined, {}))
    } else {
      return new BN(BigInt(number * 10 ** 9).toString())
    }
  }, [number, exponent])
}

export const useProposalFilters = (proposals: ProgramAccount<Proposal>[], proposalFilter: ProposalFilter) => {
  return useMemo(() => {
    if (proposalFilter === "active") {
      return proposals.filter((p) => p.account.state === ProposalState.Voting);
    } else if (proposalFilter === "inactive") {
      return proposals.filter(
        (p) => p.account.isVoteFinalized() || p.account.isPreVotingState()
      );
    } else if (proposalFilter === "passed") {
      return proposals.filter((p) => p.account.state === ProposalState.Succeeded);
    } else if (proposalFilter === "rejected") {
      return proposals.filter((p) => p.account.state === ProposalState.Defeated);
    } else if (proposalFilter === "all") {
      return proposals;
    } else {
      return proposals;
    }
  }, [proposalFilter, proposals]);
};

export function useCountdown(proposal: ProgramAccount<Proposal>, governance: ProgramAccount<Governance>) {
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
      proposal.account.votingAt
        ? dateToString(new Date(proposal.account.votingAt.toNumber() * 1000))
        : undefined,
    [proposal.account.votingAt]
  );
  const endDate = useMemo(() => {
    const deadline = getVotingDeadline(proposal, governance);
    return deadline
      ? dateToString(new Date(deadline.toNumber() * 1000))
      : undefined;
  }, [proposal, governance]);

  return { startDate, endDate, countdown };
}

/** 
 * Returns the time voting ended.
 * Returns the estimated end time if voting is ongoing.
 * Returns undefined if in the Draft state. */
export function getVotingDeadline(proposal: ProgramAccount<Proposal>, governance: ProgramAccount<Governance>): BN | undefined {
  if (proposal.account.votingCompletedAt) {
    return proposal.account.votingCompletedAt;
  }
  return proposal.account.votingAt?.addn(governance.account.config.maxVotingTime);
}

export interface VoterDisplayData {
  user: PublicKey;
  voteKind: VoteOption;
  voteWeight: BN;
}

export enum VoteOption {
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

export function getVoteType(vote: VoteKind | undefined): VoteOption {
  if(vote === undefined) {
    return VoteOption.Undecided
  } else if (vote === VoteKind.Approve) {
    return  VoteOption.Yes
  } else if (vote === VoteKind.Deny) {
    return  VoteOption.No
  } else {
    return VoteOption.Abstain
  }
}

export function getVoterDisplayData(voteRecord: ProgramAccount<VoteRecord> | undefined): VoterDisplayData | undefined {
  if(!voteRecord) {
    return undefined;
  }
  const yesVoteWeight = voteRecord.account.getYesVoteWeight();
  const noVoteWeight = voteRecord.account.getNoVoteWeight();
  const voteKind = getVoteType(voteRecord.account.vote?.voteType)
  return {
    user: voteRecord.account.governingTokenOwner,
    voteKind,
    voteWeight: yesVoteWeight ?? noVoteWeight ?? new BN(0)
  }
}

export function useVoterDisplayData(
  voteRecords: ProgramAccount<VoteRecord>[],
  tokenOwnerRecords: ProgramAccount<TokenOwnerRecord>[]
): VoterData {
  return useMemo(() => {
    const mapper = (user: PublicKey, amount: BN, label: VoteOption) => ({
      user: user,
      voteKind: label,
      voteWeight: amount,
      key: user.toBase58(),
    });

    const undecidedData = tokenOwnerRecords
      .filter(
        (tor) =>
          !tor.account.governingTokenDepositAmount.isZero() &&
          !voteRecords.some(
            (vt) =>
              vt.account.governingTokenOwner.toBase58() ===
              tor.account.governingTokenOwner.toBase58()
          )
      )
      .map((tor) =>
        mapper(
          tor.account.governingTokenOwner,
          tor.account.governingTokenDepositAmount,
          VoteOption.Undecided
        )
      );

    // const allVotesData = voteRecords
    //   .filter((vr) => vr.account.getYesVoteWeight()?.gt(ZERO))
    //   .map((vr) =>
    //     mapper(
    //       vr.account.governingTokenOwner.toBase58(),
    //       vr.account.getYesVoteWeight()!,
    //       VoteType.Yes || VoteType.No || VoteType.Abstain
    //     )
    //   );

    const yesVoteData = voteRecords
      .filter((vr) => vr.account.getYesVoteWeight()?.gt(ZERO))
      .map((vr) =>
        mapper(
          vr.account.governingTokenOwner,
          vr.account.getYesVoteWeight()!,
          VoteOption.Yes
        )
      );

    const noVoteData = voteRecords
      .filter((vr) => vr.account.getNoVoteWeight()?.gt(ZERO))
      .map((vr) =>
        mapper(
          vr.account.governingTokenOwner,
          vr.account.getNoVoteWeight()!,
          VoteOption.No
        )
      );

    // const abstainVoteData = voteRecords
    //   .filter(vr => vr.info.getNoVoteWeight()?.gt(ZERO))
    //   .map(vr =>
    //     mapper(
    //       vr.info.governingTokenOwner,
    //       vr.info.getAbstainVoteWeight()!,
    //       VoteType.Abstain,
    //     ),
    //   );

    const data = [...undecidedData, ...yesVoteData, ...noVoteData].sort(
      (a, b) => b.voteWeight.cmp(a.voteWeight)
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

export function getVoteCounts(proposal: ProgramAccount<Proposal>) {
  const yes = proposal.account.getYesVoteCount();
  const no = proposal.account.getNoVoteCount();
  const abstain = new BN(0); // FIXME: multiple choice votes

  const total = yes.add(no).add(abstain)
  const yesPercent = total.isZero() ? 0 : bnToIntLossy(yes) / bnToIntLossy(total) * 100
  const yesAbstainPercent = total.isZero() ? 0 : bnToIntLossy(abstain.add(yes)) / bnToIntLossy(total) * 100
  return { yes, no, abstain, total, yesPercent: yesPercent, yesAbstainPercent }
}

export const useWalletVoteRecords = () => {
  const { wallet } = useRpcContext();
  return useGovernanceAccounts<VoteRecord>(VoteRecord, [
    pubkeyFilter(1 + 32, wallet.publicKey),
  ]);
};

export function useAirdropsByWallet(airdrops: Airdrop[] | undefined, wallet: PublicKey | undefined) {
  return useMemo(() => {
    if (!airdrops || !wallet) {
      return undefined
    }

    return (airdrops
      .map(airdrop => airdrop.getRecipient(wallet))
      .filter(recipient => !!recipient) as AirdropTarget[])
      .sort((a, b) => a?.amount.gt(b?.amount) ? -1 : 1)
  }, [airdrops, wallet])
}

export function useClaimsCount(airdrops: AirdropTarget[] | undefined) {
  return useMemo(() => {
    if (!airdrops) {
      return 0;
    }
    let claims = 0;
    for (let i = 0; i < airdrops.length; i++) {
      const airdrop = airdrops[i];
      if (airdrop.amount.gtn(0)) {
        claims++;
      }
    }
    return claims;
  }, [airdrops])
}

/** Returns if the user can unstake.
 * False when a user has voted on proposals.
 * False when a user has created a proposal that is not complete. */
export function useWithdrawVotesAbility(tokenOwnerRecord: ProgramAccount<TokenOwnerRecord> | undefined) {
  return tokenOwnerRecord?.account.outstandingProposalCount === 0;
}