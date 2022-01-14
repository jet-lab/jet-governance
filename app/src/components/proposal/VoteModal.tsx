import { Modal } from "antd";
import { useState } from "react";
import { ParsedAccount } from "../../contexts";
import { Governance, Proposal, TokenOwnerRecord } from "../../models/accounts";
import { YesNoVote } from "../../models/instructions";
import {
  useProposalsByGovernance,
  useTokenOwnerVoteRecord,
} from "../../hooks/apiHooks";
import { useCountdown } from "../../hooks/proposalHooks";
import { useRpcContext } from "../../hooks/useRpcContext";
import { JET_GOVERNANCE } from "../../utils";
import { StakeAccount, StakePool } from "@jet-lab/jet-engine";
import { useStakedBalance } from "../../hooks/useStaking";
import React from "react";

export const VoteModal = (props: {
  vote: YesNoVote | undefined;
  visible: boolean;
  onClose: () => void;
  governance: ParsedAccount<Governance>;
  proposal: ParsedAccount<Proposal>;
  tokenOwnerRecord?: ParsedAccount<TokenOwnerRecord>;
  stakeAccount: StakeAccount | undefined,
  stakePool: StakePool | undefined
}) => {
  const {
    vote,
    visible,
    onClose,
    governance,
    proposal,
    tokenOwnerRecord,
    stakeAccount,
    stakePool
  } = props;

  const [voteSuccessModal, setVoteSuccessModal] = useState(false);
  const { endDate } = useCountdown(proposal.info, governance.info);
  const rpcContext = useRpcContext();

  let voteText: string;
  const { stakedJet } = useStakedBalance(stakeAccount, stakePool);

  if (vote === YesNoVote.Yes) {
    voteText = "in favor of";
  } else if (vote === YesNoVote.No) {
    voteText = "against";
  } /*if (vote === "abstain")*/ else {
    voteText = "to abstain from";
  }

  // Handlers for vote modal
  const confirmVote = async (vote: YesNoVote) => {
    // await castVote(
    //   rpcContext,
    //   governance.info.realm,
    //   proposal,
    //   tokenOwnerRecord!.pubkey,
    //   vote
    // );
    // debugger;
    // onClose();
    setVoteSuccessModal(true);
  };

  // Handlers for tx success all set modal
  const proposals = useProposalsByGovernance(JET_GOVERNANCE);
  const activeProposals = proposals.filter((p) => p.info.isVoting());

  const onOk = () => {
    setVoteSuccessModal(false);
  };

  return (
    <>
      <Modal
        title="Set a vote!"
        visible={visible && vote === undefined}
        okText="Okay"
        onOk={onClose}
        onCancel={onClose}
        cancelButtonProps={{ style: { display: "none " } }}
      >
        <p>Please select a vote.</p>
      </Modal>

      <Modal
        title={`You are about to vote ${voteText} proposal "${proposal.info.name}"`}
        visible={visible && vote !== undefined}
        okText="Confirm vote"
        onOk={() => vote !== undefined && confirmVote(vote)}
        onCancel={onClose}
        closable={false}
      >
        <p>This proposal hash is {proposal.pubkey.toBase58()}.</p>
        <p>
          You have {Intl.NumberFormat().format(stakedJet)} JET staked, and
          will be able to unstake these funds when voting ends on {endDate}.
        </p>{" "}
        {/** FIXME */}
      </Modal>

      <Modal
        title="All set"
        visible={voteSuccessModal}
        okText="Okay"
        onOk={onOk}
        onCancel={onOk}
        cancelButtonProps={{ style: { display: "none " } }}
      >
        <p>
          You've successfully voted <strong>{voteText}</strong> proposal #:{" "}
          {proposal.info.name}.
        </p>

        <h2 className="text-gradient">Vote on other proposals:</h2>

        <p>
          {activeProposals && activeProposals.length > 0
            ? activeProposals?.map((proposal) => `HELLO ${proposal.info.name}`)
            : "There are no active proposals at this time."}
        </p>
      </Modal>
    </>
  );
};
