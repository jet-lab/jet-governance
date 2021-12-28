import { Modal } from "antd";
import React from "react";
import { ParsedAccount } from "../../contexts";
import { Governance, Proposal, TokenOwnerRecord } from "../../models/accounts";
import { useCountdown } from "../../hooks/proposalHooks";
import { YesNoVote } from "../../models/instructions";
import {
  useTokenOwnerVoteRecord,
} from '../../hooks/apiHooks';
import { CastVoteButton } from "../../views/proposal/components/buttons/castVoteButton";
import { useHasVoteTimeExpired } from "../../hooks/useHasVoteTimeExpired";

export const VoteModal = (props: {
  vote: YesNoVote;
  visible: boolean;
  onClose: () => void;
  governance: ParsedAccount<Governance>;
  proposal: ParsedAccount<Proposal>;
  tokenOwnerRecord: ParsedAccount<TokenOwnerRecord>;
}) => {
  const {
    vote,
    visible,
    onClose,
    governance,
    proposal,
    tokenOwnerRecord,
  } = props;
  
  const hasVoteTimeExpired = useHasVoteTimeExpired(governance, proposal);
  const voteRecord = useTokenOwnerVoteRecord(
    proposal.pubkey,
    tokenOwnerRecord?.pubkey,
  );
  const stakedBalance = 20;

  let voteType: string;
  if (vote === YesNoVote.Yes) {
    voteType = "in favor of";
  } else if (vote === YesNoVote.No) {
    voteType = "against";
  } else /*if (vote === "abstain")*/ {
    voteType = "to abstain from";
  }
  const { endDate } = useCountdown(proposal.info, governance.info);

  // Handlers for vote modal
  const confirmVote = () => {
    onClose();
  };

  return (
    <Modal
      title={`You are about to vote ${voteType} proposal #${proposal.pubkey.toBase58()}`}
      visible={visible}
      okText="Confirm vote"
      onOk={confirmVote}
      onCancel={() => onClose()}
      closable={false}
    >
      <p>You have {stakedBalance} JET staked, and will be able to unstake these funds when voting ends at {endDate}.</p> {/** FIXME */}
      <CastVoteButton
        governance={governance}
        proposal={proposal}
        tokenOwnerRecord={tokenOwnerRecord}
        vote={vote}
        voteRecord={voteRecord}
        hasVoteTimeExpired={hasVoteTimeExpired}
      />
    </Modal>
  );
};
