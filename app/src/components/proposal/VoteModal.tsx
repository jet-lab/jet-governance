import { Modal } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { ParsedAccount } from "../../contexts";
import { Governance, Proposal, TokenOwnerRecord } from "../../models/accounts";
import { castVote } from "../../actions/castVote";
import { YesNoVote } from "../../models/instructions";
import {
  useProposalsByGovernance,
  useTokenOwnerVoteRecord,
} from '../../hooks/apiHooks';
import { useCountdown } from "../../hooks/proposalHooks";
import { useRpcContext } from "../../hooks/useRpcContext";
import { useUser } from "../../hooks/useClient";
import { JET_GOVERNANCE } from "../../utils";

export const VoteModal = (props: {
  vote: YesNoVote;
  visible: boolean;
  onClose: () => void;
  governance: ParsedAccount<Governance>;
  proposal: ParsedAccount<Proposal>;
  tokenOwnerRecord?: ParsedAccount<TokenOwnerRecord>;
}) => {
  const {
    vote,
    visible,
    onClose,
    governance,
    proposal,
    tokenOwnerRecord,
  } = props;

  const [voteText, setVoteText] = useState("in favor of");
  const [allSetModal, setAllSetModal] = useState(false);

  const { stakedBalance } = useUser();

  useEffect(() => {
  if (vote === YesNoVote.Yes) {
    setVoteText("in favor of");
  } else if (vote === YesNoVote.No) {
    setVoteText("against");
  } else /*if (vote === "abstain")*/ {
    setVoteText("to abstain from");
  }
  }, [vote])

  const { endDate } = useCountdown(proposal.info, governance.info);
  const rpcContext = useRpcContext();

  // Handlers for vote modal
  const confirmVote = async () => {
    if (tokenOwnerRecord) {
      castVote(
        rpcContext,
        governance.info.realm,
        proposal,
        tokenOwnerRecord.pubkey,
        vote,
      ).then(() => {
        setAllSetModal(true)
        onClose();
      })
    }
  }

  // Handlers for tx success all set modal
  const proposals = useProposalsByGovernance(JET_GOVERNANCE);
  const activeProposals = proposals.filter((p) => p.info.isVoting());

  const handleOk = () => {
    setAllSetModal(false);
  };

  const handleCancel = () => {
    setAllSetModal(false);
  };

  return (
    <>
    <Modal
      title={`You are about to vote ${voteText} proposal "${proposal.info.name}"`}
      visible={visible}
      okText="Confirm vote"
      onOk={confirmVote}
      onCancel={() => onClose()}
      closable={false}
    >
      <p>This proposal hash is {proposal.pubkey.toBase58()}.</p>
      <p>You have {Intl.NumberFormat().format(stakedBalance)} JET staked, and will be able to unstake these funds when voting ends on {endDate}.</p> {/** FIXME */}
    </Modal>
      
    <Modal
      title="All set"
      visible={allSetModal}
      okText="Okay"
      onOk={handleOk}
      onCancel={handleCancel}
      cancelButtonProps={{ style: { display: "none " } }}
    >
      <p>
        You've successfully voted <strong>{voteText}</strong> proposal #: {proposal.info.name}.
      </p>

      <h2 className="text-gradient">Vote on other proposals:</h2>

      <p>
      {activeProposals && activeProposals.length > 0
        ? activeProposals?.map((proposal) => (
            `HELLO ${proposal.info.name}`
          ))
        : "There are no active proposals at this time."}
      </p>
    </Modal>

      </>
  );
};
