import { Modal, Steps } from "antd";
import React, { useCallback, useEffect, useState } from "react";
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
import { castVote } from "../../actions/castVote";
import { getPubkeyIndex } from "../../models/PUBKEYS_INDEX";

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
  
  const [current, setCurrent] = useState(0);

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
    await castVote(
      rpcContext,
      governance.info.realm,
      proposal,
      tokenOwnerRecord!.pubkey,
      vote
    );
    setCurrent(2);
  };

  // Handlers for tx success all set modal
  const proposals = useProposalsByGovernance(JET_GOVERNANCE);
  const activeProposals = proposals.filter((p) => p.info.isVoting());

  useEffect(() => {
    if (vote === undefined) {
      setCurrent(0)
    } else {
      setCurrent(1)
    }
  }, [vote])

  const steps = [
    {
      title: 'Set a vote!',
      okText: "Okay",
      onOk: () => {},
      onCancel: () => onClose(),
      content: [<p>Please select a vote.</p>],
      closable: true
    },
    {
      title: `You are about to vote ${voteText} proposal "${proposal.info.name}"`,
      okText: "Confirm vote",
      onOk: () => {vote !== undefined && confirmVote(vote)},
      onCancel: () => { },
      content: [<>
        <p>
          You have {Intl.NumberFormat().format(stakedJet)} JET staked, and
          will be able to unstake these funds when voting ends on {endDate}.
        </p>
      </>],
      closable: true
    },
    {
      title: `All set`,
      okText: "Okay",
      onOk: () => onClose(),
      onCancel: () => onClose(),
      content: [<>
      <p>
          You've successfully voted <strong>{voteText}</strong> proposal #{getPubkeyIndex(proposal.pubkey.toBase58())}:{" "}
          {proposal.info.name}.
        </p>

        <h2 className="text-gradient" style={{marginLeft: 0}}>Vote on other proposals:</h2>

        <p>
          {activeProposals && activeProposals.length > 0
            ? activeProposals?.map((proposal) => `HELLO ${proposal.info.name}`)
            : "There are no active proposals at this time."}
        </p>
      </>],
      closable: true
    },
  ];

  return (
    <Modal
      title={steps[current].title}
      visible={visible}
      okText={steps[current].okText}
      onOk={steps[current].onOk}
      onCancel={steps[current].onCancel}
      cancelButtonProps={{ style: { display: "none " } }}
    >
      {steps[current].content}
    </Modal>
  );
};
