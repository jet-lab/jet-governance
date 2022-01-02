import BN from "bn.js";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { ZERO } from "../constants";
import { ParsedAccount } from "../contexts";
import { useProposalContext } from "../contexts/proposal";
import { Governance, Proposal, ProposalState, TokenOwnerRecord, VoteRecord } from "../models/accounts";

export const useProposalFilters = (proposals: ParsedAccount<Proposal>[]) => {
  const { showing } = useProposalContext();

  return useMemo(() => {
    if (showing === "active") {
      return proposals.filter((p) => p.info.isVoting());
    } else if (showing === "inactive") {
      return proposals.filter((p) => p.info.isVoteFinalized() || p.info.isPreVotingState());
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

export function useCountdown(proposal: Proposal, governance: Governance) {
  const [countdown, setCountdown] = useState("");

  // Get remaining days, hours and minutes for a proposal
  const getElapsedTime = (timespan: number): string => {
    if (timespan <= 0) {
      return "0:00:00";
    }

    const days = Math.floor(timespan / 86400);
    timespan -= days * 86400;

    const hours = Math.floor(timespan / 3600) % 24;
    timespan -= hours * 3600;

    const minutes = Math.floor(timespan / 60) % 60;
    timespan -= minutes * 60;

    const seconds = Math.floor(timespan % 60);

    function zeroPad(num: number, places: number) {
      return String(num).padStart(places, '0');
    }
    return `${days}:${zeroPad(hours, 2)}:${zeroPad(minutes, 2)}:${zeroPad(seconds, 2)}`;
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

  const startDate = useMemo(() => proposal.votingAt ? new Date(proposal.votingAt.toNumber() * 1000).toLocaleString() : undefined, [proposal.votingAt])
  const endDate = useMemo(() => {
    const deadline = proposal.getVotingDeadline(governance);
    return deadline ?
      new Date(deadline.toNumber() * 1000).toLocaleString() :
      undefined
  }, [proposal, governance])

  return { startDate, endDate, countdown};
}

export interface VoterDisplayData {
  name: string;
  title: string;
  group: VoteType;
  value: BN;
}

export enum VoteType {
  Undecided = 'Undecided',
  Yes = 'Yea',
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