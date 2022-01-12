import BN from "bn.js";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
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
  const { showing } = useProposalContext();

  return useMemo(() => {
    if (showing === "active") {
      return proposals.filter((p) => p.info.isVoting());
    } else if (showing === "inactive") {
      return proposals.filter(
        (p) => p.info.isVoteFinalized() || p.info.isPreVotingState()
      );
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
};

export function useCountdown(proposal: Proposal, governance: Governance) {
  const [countdown, setCountdown] = useState("");

  // Get remaining days, hours and minutes for a proposal
  const getElapsedTime = (timespan: number): string => {
    if (timespan <= 0) {
      return "Voting ended";
    }

    const days = Math.floor(timespan / 86400);
    timespan -= days * 86400;

    const hours = Math.floor(timespan / 3600) % 24;
    timespan -= hours * 3600;

    const minutes = Math.floor(timespan / 60) % 60;
    timespan -= minutes * 60;

    const seconds = Math.floor(timespan % 60);

    function zeroPad(num: number, places: number) {
      return String(num).padStart(places, "0");
    }
    return `${zeroPad(days, 2)}:${zeroPad(hours, 2)}:${zeroPad(minutes, 2)}:${zeroPad(seconds, 2)}`;
  };

  useEffect(() => {
    if (proposal.isVoteFinalized()) {
      setCountdown(getElapsedTime(0));
      return;
    }

    const getTimeToVoteEnd = () => {
      const now = moment().unix();

      let timeToVoteEnd = proposal.isPreVotingState()
        ? governance.config.maxVotingTime
        : proposal.votingAt?.toNumber()! +
          governance.config.maxVotingTime -
          now;

      return getElapsedTime(timeToVoteEnd);
    };

    const updateCountdown = () => {
      const newState = getTimeToVoteEnd();
      setCountdown(newState);
    };

    const interval = setInterval(() => {
      updateCountdown();
    }, 1000);

    updateCountdown();
    return () => clearInterval(interval);
  }, [proposal, governance]);

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
