import { Modal, Steps } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { getProposalUrl } from "../../tools/routeTools";
import { OYSTER_GOV_PROGRAM_ID } from "../../utils";
import { head } from "lodash";
import { Link } from "react-router-dom";

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

  const { endDate, countdown } = useCountdown(proposal.info, governance.info);
  const rpcContext = useRpcContext();
  const voteRecord = useTokenOwnerVoteRecord(
    proposal.pubkey,
    tokenOwnerRecord?.pubkey
  );

  let voteText: string;
  const { stakedJet } = useStakedBalance(stakeAccount, stakePool);

  useEffect(() => {
    if (vote === undefined) {
      setCurrent(0)
    } else {
      setCurrent(1)
    }
  }, [vote])

  if (vote === YesNoVote.Yes) {
    voteText = "in favor of";
  } else if (vote === YesNoVote.No) {
    voteText = "against";
  } /*if (vote === "abstain")*/ else {
    voteText = "to abstain from";
  }

  // Handlers for vote modal
  const confirmVote = async (vote: YesNoVote) => {
    if (tokenOwnerRecord) {
      //Fixme: withdraw existing vote before sending new tx
      castVote(
        rpcContext,
        governance.info.realm,
        proposal,
        tokenOwnerRecord.pubkey,
        vote,
        voteRecord?.tryUnwrap()
      ).then(() => setCurrent(2));
    }
  };

  // Handlers for tx success all set modal
  const proposals = useProposalsByGovernance(JET_GOVERNANCE);
  const activeProposals = proposals.filter((p) => p.info.isVoting());

  const proposalMap = (proposal: ParsedAccount<Proposal>) => {
    const headlineUrl = getProposalUrl(
      proposal.pubkey,
      proposal.info.name.substring(0, 15).replace(" ", "-"))

    return (
    <div>
      <p><Link to={headlineUrl}><u>Proposal {getPubkeyIndex(proposal.pubkey.toBase58())}</u></Link>: {proposal.info.name}. <span className="secondary-text">Ends in {countdown}</span>
    </p>
    </div>
  )}

  const steps = [
    {
      title: 'Set a vote!',
      okText: "Okay",
      onOk: () => {},
      onCancel: () => onClose(),
      content: [<p>Please select a vote.</p>],
      closable: true,
      cancelButtonProps: { display: "none " },
    },
    {
      title: `Confirm vote`,
      okText: "Confirm",
      onOk: () => {vote !== undefined && confirmVote(vote)},
      onCancel: () => onClose(),
      content: [<>
        <p>
          You are about to vote <strong>{voteText}</strong> proposal "{proposal.info.name}".
        </p>
        <p>
          You have {Intl.NumberFormat().format(stakedJet)} JET staked, and
          will be able to unstake these funds when voting ends on {endDate}.
        </p>
      </>],
      closable: true,
      cancelButtonProps: undefined,
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
            ? activeProposals?.map((proposal) => proposalMap(proposal)) : "There are no active proposals at this time."}
        </p>
      </>],
      closable: true,
      cancelButtonProps: { display: "none " },
    }
  ];

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
function proposalAddress(proposalAddress: any, programId: any, arg2: any): string {
  throw new Error("Function not implemented.");
}

function programId(proposalAddress: (proposalAddress: any, programId: any, arg2: any) => string, programId: any, arg2: any): string {
  throw new Error("Function not implemented.");
}

