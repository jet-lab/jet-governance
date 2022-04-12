import { StakeBalance } from "@jet-lab/jet-engine";

import {
  Governance,
  ProgramAccount,
  Proposal,
  Realm,
  VoteRecord,
  YesNoVote,
  getTokenOwnerRecordAddress
} from "@solana/spl-governance";
import { Modal, ModalProps } from "antd";
import { ReactNode, useEffect, useState } from "react";
import { castVote } from "../../actions/castVote";
import { useConnectionConfig, useProposalContext } from "../../contexts";
import { useCountdown, VoteOption, useRpcContext } from "../../hooks";
import { getPubkeyIndex } from "../../models/PUBKEYS_INDEX";
import { notifyTransactionSuccess } from "../../tools/transactions";
import { isSignTransactionError, JET_TOKEN_MINT, sharesToTokens, toTokens } from "../../utils";
import { useBlockExplorer } from "../../contexts/blockExplorer";

enum Steps {
  Confirm = 0,
  NoVoteError = 1,
  UnknownError = 2
}

export const VoteModal = ({
  vote,
  onClose,
  realm,
  governance,
  proposal,
  voteRecord
}: {
  vote: VoteOption;
  onClose: () => void;
  realm: ProgramAccount<Realm>;
  governance: ProgramAccount<Governance>;
  proposal: ProgramAccount<Proposal>;
  voteRecord: ProgramAccount<VoteRecord> | undefined;
  stakeBalance: StakeBalance;
}) => {
  const [current, setCurrent] = useState(0);

  const { endDate } = useCountdown(proposal, governance);
  const rpcContext = useRpcContext();
  const { programId, walletPubkey } = useRpcContext();
  const {
    stakePool,
    stakeAccount,
    stakeBalance: { stakedJet },
    jetMint,
    programs,
    refresh
  } = useProposalContext();
  const { getTxExplorerUrl } = useBlockExplorer();
  const { inDevelopment } = useConnectionConfig();

  let voteText: string = "";

  useEffect(() => {
    if (vote === undefined || vote === VoteOption.Undecided) {
      setCurrent(Steps.NoVoteError);
    }
  }, [vote]);

  if (vote === VoteOption.Yes) {
    voteText = "in favor of";
  } else if (vote === VoteOption.No) {
    voteText = "against";
  }

  // Handlers for vote modal
  const confirm = async (vote: VoteOption) => {
    let yesNoVote: YesNoVote;
    if (vote === VoteOption.Yes) {
      yesNoVote = YesNoVote.Yes;
    } else if (vote === VoteOption.No) {
      yesNoVote = YesNoVote.No;
    } else {
      throw new Error("Not a yes or no vote.");
    }

    if (programs && stakePool && stakeAccount) {
      const tokenOwnerRecordPubkey = await getTokenOwnerRecordAddress(
        programId,
        realm.pubkey,
        JET_TOKEN_MINT,
        walletPubkey
      );

      castVote(
        rpcContext,
        realm,
        proposal,
        tokenOwnerRecordPubkey,
        yesNoVote,
        programs.stake,
        stakePool,
        stakeAccount,
        undefined
      )
        .then(txnSig => {
          notifyTransactionSuccess(txnSig, "Vote has been cast!", getTxExplorerUrl(txnSig));
          onClose();
        })
        .catch(err => {
          if (isSignTransactionError(err)) {
            onClose();
          } else {
            console.log(err);
            setCurrent(Steps.UnknownError);
          }
        })
        .finally(() => {
          refresh();
        });
    }
  };

  const steps: (ModalProps & { content: ReactNode })[] = [];
  steps[Steps.Confirm] = {
    title: "Confirm vote",
    okText: "Confirm",
    onOk: () => {
      vote !== VoteOption.Undecided && confirm(vote);
    },
    onCancel: () => onClose(),
    content: (
      <div className="flex column">
        <p>
          You are about to vote <strong>{voteText}</strong> JUMP-
          {getPubkeyIndex(proposal.pubkey.toBase58(), inDevelopment)}: {proposal.account.name}.
        </p>
        <p>
          You have {toTokens(sharesToTokens(stakedJet, stakePool).tokens, jetMint)} JET staked, and
          will be able to unstake these funds when voting ends on {endDate}.
        </p>
      </div>
    ),
    closable: true,
    cancelButtonProps: undefined
  };
  steps[Steps.NoVoteError] = {
    title: "Set a vote!",
    okText: "Okay",
    onOk: () => onClose(),
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
    content: <p>We're not really sure what went wrong here, please try again.</p>,
    closable: true,
    cancelButtonProps: { style: { display: "none " } }
  };

  return (
    <Modal
      title={steps[current].title}
      visible={true}
      okText={steps[current].okText}
      onOk={steps[current].onOk}
      onCancel={steps[current].onCancel}
      cancelButtonProps={{ style: steps[current].cancelButtonProps }}
    >
      {steps[current].content}
    </Modal>
  );
};
