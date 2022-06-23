import { ProposalFilter, useProposalContext } from "./../contexts";
import {
  Airdrop,
  bigIntToNumber,
  bnToNumber,
  Distribution,
  DistributionYield,
  StakeAccount,
  StakePool,
  UnbondingAccount
} from "@jet-lab/jet-engine";
import {
  Governance,
  ProgramAccount,
  Proposal,
  ProposalState,
  pubkeyFilter,
  Realm,
  TokenOwnerRecord,
  VoteKind,
  VoteRecord
} from "@solana/spl-governance";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useEffect, useMemo, useState } from "react";
import { ZERO } from "../constants";
import { dateToString, getRemainingTime, toTokens } from "../utils";
import { useGovernanceAccounts } from "./accountHooks";
import { useRpcContext } from "./useRpcContext";

export function useBN(number: number | undefined, exponent: number | null | undefined = null) {
  return useMemo(() => {
    if (number === undefined) {
      return new BN(0);
    } else if (exponent === undefined) {
      return new BN(0);
    } else if (exponent === null) {
      return new BN(number.toLocaleString(undefined, {}));
    } else {
      return new BN(BigInt(number * 10 ** 9).toString());
    }
  }, [number, exponent]);
}

export const getProposalFilters = (
  proposals: ProgramAccount<Proposal>[],
  proposalFilter: ProposalFilter,
  governance: Governance | undefined
) => {
  if (proposalFilter === "active" && governance) {
    return proposals.filter(
      p =>
        !p.account.hasVoteTimeEnded(governance) &&
        p.account.state === ProposalState.Voting &&
        p.account.votingCompletedAt !== null
    );
  } else if (proposalFilter === "inactive") {
    return proposals.filter(p => p.account.isVoteFinalized() || p.account.isPreVotingState());
  } else if (proposalFilter === "passed") {
    return proposals.filter(p => p.account.state === ProposalState.Succeeded);
  } else if (proposalFilter === "rejected") {
    return proposals.filter(p => p.account.state === ProposalState.Defeated);
  } else if (proposalFilter === "all") {
    return proposals;
  } else {
    return proposals;
  }
};

export const useProposalFilters = (
  proposals: ProgramAccount<Proposal>[] | undefined,
  proposalFilter: ProposalFilter,
  governance: Governance | undefined
) => {
  return useMemo(() => {
    if (!proposals) {
      return [];
    }
    return getProposalFilters(proposals, proposalFilter, governance);
  }, [proposalFilter, proposals, governance]);
};

export function useCountdown(
  proposal: ProgramAccount<Proposal> | undefined,
  governance: ProgramAccount<Governance> | undefined
) {
  const currentTime = useCurrentTime();

  const deadline = proposal && governance ? getVotingDeadline(proposal, governance) : undefined;

  const countdownTime = useMemo(() => {
    return deadline ? deadline.toNumber() * 1000 : undefined;
  }, [deadline]);

  const startDate = useMemo(
    () =>
      proposal?.account.votingAt
        ? dateToString(new Date(proposal.account.votingAt.toNumber() * 1000))
        : undefined,
    [proposal?.account.votingAt]
  );
  const endDate = useMemo(() => {
    const deadline = proposal && governance ? getVotingDeadline(proposal, governance) : undefined;
    // return deadline ? dateToString(new Date(deadline.toNumber() * 1000)) : undefined;
    // TODO: Change to getting actual date from program once bug in Solana gov program is fixed.

    const votingTime = governance?.account.config.maxVotingTime;
    const deadlineFromStartDate =
      proposal && proposal.account.votingAt && votingTime
        ? dateToString(new Date((bnToNumber(proposal.account.votingAt) + votingTime) * 1000))
        : undefined;

    return deadlineFromStartDate;
  }, [proposal, governance]);

  let endDateOrCountdown: string | undefined = useMemo(() => {
    if (!proposal?.account.isPreVotingState() && !!countdownTime && !!endDate) {
      return proposal?.account.state === ProposalState.Voting && countdownTime > currentTime
        ? `Ends in ${getRemainingTime(currentTime, countdownTime)}`
        : `Ended on: ${endDate}`;
    }
  }, [countdownTime, currentTime, endDate, proposal?.account]);

  return { startDate, endDate, countdownTime, endDateOrCountdown };
}

export function useCurrentTime() {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second
  useEffect(() => {
    const secondInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(secondInterval);
  });
  return currentTime;
}

export function useOtherActiveProposals(
  proposals: ProgramAccount<Proposal>[] | undefined,
  currentProposal: ProgramAccount<Proposal>,
  governance: ProgramAccount<Governance>
) {
  let currentTime = useCurrentTime();
  currentTime = currentTime / 1000;

  return proposals?.filter(p => {
    const deadline = getVotingDeadline(p, governance);
    const hasDeadlineLapsed = deadline ? currentTime > bnToNumber(deadline) : false;
    return (
      !p.pubkey.equals(currentProposal.pubkey) &&
      p.account.state === ProposalState.Voting &&
      !hasDeadlineLapsed
    );
  });
}

/**
 * Returns the time voting ended.
 * Returns the estimated end time if voting is ongoing.
 * Returns undefined if in the Draft state. */
export function getVotingDeadline(
  proposal: ProgramAccount<Proposal>,
  governance: ProgramAccount<Governance>
): BN | undefined {
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
  Abstain = "Abstain"
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
  if (vote === undefined) {
    return VoteOption.Undecided;
  } else if (vote === VoteKind.Approve) {
    return VoteOption.Yes;
  } else if (vote === VoteKind.Deny) {
    return VoteOption.No;
  } else {
    return VoteOption.Abstain;
  }
}

export function getVoterDisplayData(
  voteRecord: ProgramAccount<VoteRecord> | undefined
): VoterDisplayData | undefined {
  if (!voteRecord) {
    return undefined;
  }
  const yesVoteWeight = voteRecord.account.getYesVoteWeight();
  const noVoteWeight = voteRecord.account.getNoVoteWeight();
  const voteKind = getVoteType(voteRecord.account.vote?.voteType);
  return {
    user: voteRecord.account.governingTokenOwner,
    voteKind,
    voteWeight: yesVoteWeight ?? noVoteWeight ?? new BN(0)
  };
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
      key: user.toBase58()
    });

    const undecidedData = tokenOwnerRecords
      .filter(
        tor =>
          !tor.account.governingTokenDepositAmount.isZero() &&
          !voteRecords.some(
            vt =>
              vt.account.governingTokenOwner.toBase58() ===
              tor.account.governingTokenOwner.toBase58()
          )
      )
      .map(tor =>
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
      .filter(vr => vr.account.getYesVoteWeight()?.gt(ZERO))
      .map(vr =>
        mapper(vr.account.governingTokenOwner, vr.account.getYesVoteWeight()!, VoteOption.Yes)
      );

    const noVoteData = voteRecords
      .filter(vr => vr.account.getNoVoteWeight()?.gt(ZERO))
      .map(vr =>
        mapper(vr.account.governingTokenOwner, vr.account.getNoVoteWeight()!, VoteOption.No)
      );

    const data = [...undecidedData, ...yesVoteData, ...noVoteData].sort((a, b) =>
      b.voteWeight.cmp(a.voteWeight)
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

export function useGoverningTokenDepositAmount() {
  const { tokenOwnerRecord, jetMint, walletFetched } = useProposalContext();
  return useMemo(() => {
    if (!walletFetched || !jetMint) {
      return "-";
    }
    return toTokens(tokenOwnerRecord?.account.governingTokenDepositAmount, jetMint);
  }, [tokenOwnerRecord, jetMint, walletFetched]);
}

export function getVoteCounts(proposal: ProgramAccount<Proposal>) {
  const yes = proposal.account.getYesVoteCount();
  const no = proposal.account.getNoVoteCount();
  const abstain = new BN(0); // FIXME: multiple choice votes

  const total = yes.add(no).add(abstain);
  const yesPercent = total.isZero() ? 0 : (bnToNumber(yes) / bnToNumber(total)) * 100;
  const yesAbstainPercent = total.isZero()
    ? 0
    : (bnToNumber(abstain.add(yes)) / bnToNumber(total)) * 100;
  return { yes, no, abstain, total, yesPercent: yesPercent, yesAbstainPercent };
}

export const useWalletVoteRecords = () => {
  const { wallet } = useRpcContext();
  return useGovernanceAccounts<VoteRecord>(VoteRecord, [pubkeyFilter(1 + 32, wallet.publicKey)]);
};

export function useAirdropsByWallet(
  airdrops: Airdrop[] | undefined,
  wallet: PublicKey | undefined
) {
  return useMemo(() => {
    if (!airdrops || !wallet) {
      return undefined;
    }

    return airdrops?.filter(airdrop => {
      const found = airdrop.targetInfo.recipients.find(({ recipient }) => recipient.equals(wallet));
      return !!found;
    });
  }, [airdrops, wallet]);
}

export function useWithdrawableCount(unbondingAccounts: UnbondingAccount[] | undefined) {
  if (!unbondingAccounts) {
    return 0;
  }
  let count = 0;
  for (let i = 0; i < unbondingAccounts.length; i++) {
    if (UnbondingAccount.isUnbonded(unbondingAccounts[i])) {
      count++;
    }
  }
  return count;
}

export function useClaimsCount(airdrops: Airdrop[] | undefined, wallet: PublicKey | undefined) {
  const [currentTime, setCurrentTime] = useState(Date.now());
  // Update current time every second
  useEffect(() => {
    const secondInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(secondInterval);
  });

  return useMemo(() => {
    if (!airdrops || !wallet) {
      return 0;
    }

    let claims = 0;
    for (let i = 0; i < airdrops.length; i++) {
      const airdrop = airdrops[i];

      // check expiration
      if (bnToNumber(airdrop.airdrop.expireAt) * 1000 <= currentTime) continue;
      // check finalized
      if (airdrop.targetInfo.finalized.isZero()) continue;

      let found = airdrop.targetInfo.recipients.find(({ recipient }) => recipient.equals(wallet));

      // check claimed
      if (found?.amount.gt(new BN(0))) {
        claims++;
      }
    }
    return claims;
  }, [airdrops, wallet, currentTime]);
}

export function useAvailableAirdrop(
  airdrops: Airdrop[] | undefined,
  wallet: PublicKey | undefined
) {
  const [currentTime, setCurrentTime] = useState(Date.now());
  // Update current time every second
  useEffect(() => {
    const secondInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(secondInterval);
  });

  return useMemo(() => {
    if (!airdrops || !wallet) {
      return undefined;
    }

    let availableAirdrop = [];
    for (let i = 0; i < airdrops.length; i++) {
      const airdrop = airdrops[i];

      // check finalized
      if (airdrop.targetInfo.finalized.isZero()) continue;
      // check expiration
      if (bnToNumber(airdrop.airdrop.expireAt) * 1000 <= currentTime) continue;

      let found = airdrop.targetInfo.recipients.find(({ recipient }) => recipient.equals(wallet));

      // check claimed
      if (found?.amount.gt(new BN(0))) {
        availableAirdrop.push(airdrop);
      }
    }
    return availableAirdrop;
  }, [airdrops, wallet, currentTime]);
}

/** Returns if the user can unstake.
 * False when a user has voted on proposals.
 * False when a user has created a proposal that is not complete. */
export function useWithdrawVotesAbility(
  tokenOwnerRecord: ProgramAccount<TokenOwnerRecord> | undefined
) {
  return (
    tokenOwnerRecord?.account.outstandingProposalCount === 0 ||
    tokenOwnerRecord?.account.outstandingProposalCount === undefined
  );
}

export function useStakePoolAndRealmCompatible(
  stakePool: StakePool | undefined,
  realm: ProgramAccount<Realm> | undefined,
  governance: ProgramAccount<Governance> | undefined
) {
  if (stakePool && realm) {
    if (!stakePool.stakePool.governanceRealm.equals(realm.pubkey)) {
      console.error(
        `Realm ${realm.pubkey.toBase58()} is not compatible with stake pool ${stakePool.stakePool.governanceRealm.toBase58()}. Some features will not work.`
      );
    }
  }
  if (realm && governance) {
    if (!realm.pubkey.equals(governance?.account.realm)) {
      console.error(
        `Realm ${realm.pubkey.toBase58()} is not compatible with governance ${governance.account.realm.toBase58()}. Some features will not work.`
      );
    }
  }
}

/**
 * TODO:
 *
 * @static
 * @param {(Distribution[] | undefined)} distributions
 * @param {(StakePool | undefined)} stakePool
 * @param {(StakeAccount | undefined)} stakeAccount
 * @returns {(DistributionYield | undefined)}
 * @memberof Distribution
 */
export function useEstimateCombinedYield(
  distributions: Distribution[] | undefined,
  stakePool: StakePool | undefined,
  stakeAccount: StakeAccount | undefined
): DistributionYield | undefined {
  return useMemo(() => {
    if (!distributions || !stakePool) {
      return undefined;
    }
    let usersShares: number;
    const totalShares = bnToNumber(stakePool.stakePool.bonded.shares);
    const totalDeposits = bigIntToNumber(stakePool.vault.amount);
    if (stakeAccount) {
      usersShares = bnToNumber(stakeAccount.stakeAccount.bondedShares);
    } else {
      usersShares = 1;
    }
    const combinedYield = Distribution.estimateCombinedYield(
      distributions,
      totalDeposits,
      totalShares,
      usersShares
    );
    if (stakePool) {
      return combinedYield;
    }

    return new DistributionYield(combinedYield.apr);
  }, [distributions, stakePool, stakeAccount]);
}
