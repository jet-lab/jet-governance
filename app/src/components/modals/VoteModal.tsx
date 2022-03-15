import { Modal, ModalProps } from "antd";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  getVotingDeadline,
  useCountdown,
  useCurrentTime,
  useOtherActiveProposals,
  VoteOption
} from "../../hooks/proposalHooks";
import { useRpcContext } from "../../hooks/useRpcContext";
import { bnToNumber, StakeBalance } from "@jet-lab/jet-engine";
import { getPubkeyIndex } from "../../models/PUBKEYS_INDEX";
import { toTokens } from "../../utils";
import {
  Governance,
  ProgramAccount,
  Proposal,
  ProposalState,
  Realm,
  TokenOwnerRecord,
  VoteRecord,
  YesNoVote
} from "@solana/spl-governance";
import { castVote } from "../../actions/castVote";
import { useProposalContext } from "../../contexts/proposal";
import { useWallet } from "@solana/wallet-adapter-react";
import { VoteOnOtherProposal } from "../proposal/VoteOnOtherProposal";

enum Steps {
  ConfirmVote = 0,
  VoteSuccess = 1,
  NoVoteError = 2,
  UnknownError = 3
}

export const VoteModal = ({
  vote,
  visible,
  onClose,
  realm,
  governance,
  proposal,
  tokenOwnerRecord,
  voteRecord
}: {
  vote: VoteOption;
  visible: boolean;
  onClose: () => void;
  realm: ProgramAccount<Realm>;
  governance: ProgramAccount<Governance>;
  proposal: ProgramAccount<Proposal>;
  tokenOwnerRecord?: ProgramAccount<TokenOwnerRecord>;
  voteRecord: ProgramAccount<VoteRecord> | undefined;
  stakeBalance: StakeBalance;
}) => {
  const [current, setCurrent] = useState(0);

  const { endDate } = useCountdown(proposal, governance);
  const rpcContext = useRpcContext();
  const {
    stakePool,
    stakeAccount,
    stakeBalance,
    jetMint,
    programs,
    refresh,
    proposalsByGovernance
  } = useProposalContext();

  let voteText: string = "";

  useEffect(() => {
    if (vote === undefined) {
      setCurrent(Steps.NoVoteError);
    } else {
      setCurrent(Steps.ConfirmVote);
    }
  }, [vote]);

  if (vote === VoteOption.Yes) {
    voteText = "in favor of";
  } else if (vote === VoteOption.No) {
    voteText = "against";
  }

  const { publicKey } = useWallet();

  // Handlers for vote modal
  const confirmVote = async (vote: VoteOption) => {
    let yesNoVote: YesNoVote;
    if (vote === VoteOption.Yes) {
      yesNoVote = YesNoVote.Yes;
    } else if (vote === VoteOption.No) {
      yesNoVote = YesNoVote.No;
    } else {
      throw new Error("Not a yes or no vote.");
    }

    if (!publicKey) {
      return;
    }

    if (tokenOwnerRecord && programs) {
      castVote(
        rpcContext,
        realm,
        proposal,
        tokenOwnerRecord.pubkey,
        yesNoVote,
        programs.stake,
        stakePool,
        stakeAccount,
        undefined,
        voteRecord ? voteRecord!.pubkey : undefined,
        stakeBalance
      )
        .then(() => {
          setCurrent(Steps.VoteSuccess);
        })
        .catch(() => setCurrent(Steps.UnknownError))
        .finally(() => {
          refresh();
        });
    }
  };

  // Handlers for tx success all set modal
  const otherActiveProposals = useOtherActiveProposals(proposalsByGovernance, proposal, governance);

  const steps: (ModalProps & { content: ReactNode })[] = [];
  steps[Steps.ConfirmVote] = {
    title: "Confirm vote",
    okText: "Confirm",
    onOk: () => {
      vote !== undefined && confirmVote(vote);
    },
    onCancel: () => onClose(),
    content: (
      <>
        <p>
          You are about to vote <strong>{voteText}</strong> JUMP-
          {getPubkeyIndex(proposal.pubkey.toBase58())}: {proposal.account.name}.
        </p>
        <p>
          You have {toTokens(stakeBalance.stakedJet, jetMint)} JET staked, and will be able to
          unstake these funds when voting ends on {endDate}.
        </p>
      </>
    ),
    closable: true,
    cancelButtonProps: undefined
  };
  steps[Steps.VoteSuccess] = {
    title: `All set`,
    okText: "Okay",
    onOk: () => onClose(),
    onCancel: () => onClose(),
    content: (
      <>
        <p>
          You've successfully voted <strong>{voteText}</strong> JUMP-
          {getPubkeyIndex(proposal.pubkey.toBase58())}: {proposal.account.name}.
        </p>
        <h2 className="text-gradient" style={{ marginLeft: 0 }}>
          Vote on other proposals:
        </h2>
        {otherActiveProposals && otherActiveProposals.length > 0
          ? otherActiveProposals.map(otherProposal => (
              <VoteOnOtherProposal proposal={otherProposal} governance={governance} />
            ))
          : "There are no other proposals at this time."}
      </>
    ),
    closable: true,
    cancelButtonProps: { style: { display: "none " } }
  };
  steps[Steps.NoVoteError] = {
    title: "Set a vote!",
    okText: "Okay",
    onOk: () => {},
    onCancel: () => onClose(),
    content: [<p>Please select a vote.</p>],
    closable: true,
    cancelButtonProps: { style: { display: "none " } }
  };
  steps[Steps.UnknownError] = {
    title: `Uh-oh`,
    okText: "Okay",
    onOk: () => onClose(),
    onCancel: () => onClose(),
    content: (
      <>
        <p>We're not really sure what went wrong here, please try again.</p>
      </>
    ),
    closable: true,
    cancelButtonProps: { style: { display: "none " } }
  };

  return (
    <Modal
      title={steps[current].title}
      visible={visible}
      okText={steps[current].okText}
      onOk={steps[current].onOk}
      onCancel={steps[current].onCancel}
      cancelButtonProps={{ style: steps[current].cancelButtonProps }}
    >
      {steps[current].content}
    </Modal>
  );
};
