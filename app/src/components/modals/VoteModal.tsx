import { Modal } from "antd";
import { useEffect, useState } from "react";
import { ParsedAccount } from "../../contexts";
import { Governance, Proposal, TokenOwnerRecord, VoteRecord } from "../../models/accounts";
import { YesNoVote } from "../../models/instructions";
import {
  useProposalsByGovernance,
} from "../../hooks/apiHooks";
import { useCountdown } from "../../hooks/proposalHooks";
import { useRpcContext } from "../../hooks/useRpcContext";
import { StakeAccount, StakeBalance, StakePool } from "@jet-lab/jet-engine";
import { castVote } from "../../actions/castVote";
import { getPubkeyIndex } from "../../models/PUBKEYS_INDEX";
import { getProposalUrl } from "../../tools/routeTools";
import { Link } from "react-router-dom";

export const VoteModal = ({
  vote,
  visible,
  onClose,
  governance,
  proposal,
  tokenOwnerRecord,
  stakeAccount,
  stakePool,
  voteRecord,
  stakeBalance
}: {
  vote: YesNoVote | undefined;
  visible: boolean;
  onClose: () => void;
  governance: ParsedAccount<Governance>;
  proposal: ParsedAccount<Proposal>;
  tokenOwnerRecord?: ParsedAccount<TokenOwnerRecord>;
  stakeAccount: StakeAccount | undefined,
  stakePool: StakePool | undefined,
  voteRecord: ParsedAccount<VoteRecord> | undefined,
  stakeBalance: StakeBalance
}) => {  
  const [current, setCurrent] = useState(0);

  const { endDate, countdown } = useCountdown(proposal.info, governance.info);
  const rpcContext = useRpcContext();

  let voteText: string = "";
  const stakedJet = stakeBalance.stakedJet;

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
  }

  // Handlers for vote modal
  const confirmVote = async (vote: YesNoVote) => {
    if (tokenOwnerRecord) {
    castVote(
      rpcContext,
      governance.info.realm,
      proposal,
      tokenOwnerRecord.pubkey,
      vote,
      voteRecord ? voteRecord!.pubkey : undefined
    )
      .then(() => setCurrent(2))
      .catch(() => setCurrent(3));
    }
  };

  // Handlers for tx success all set modal
  const proposals = useProposalsByGovernance();
  const activeProposals = proposals.filter((p) => p.info.isVoting());

  const proposalMap = (proposal: ParsedAccount<Proposal>, key: number) => {
    const headlineUrl = getProposalUrl(
      proposal.pubkey,
      proposal.info.name.substring(0, 15).replace(" ", "-"))

    return (
    <div key={key}>
        <p>
          <Link to={headlineUrl}><u>Proposal {getPubkeyIndex(proposal.pubkey.toBase58())}</u></Link>: {proposal.info.name}. <span className="secondary-text">Ends in {countdown}</span>
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
            ? activeProposals?.map((proposal, key) => proposalMap(proposal, key)) : "There are no active proposals at this time."}
        </p>
      </>],
      closable: true,
      cancelButtonProps: { display: "none " },
    },
    {
      title: `Uh-oh`,
      okText: "Okay",
      onOk: () => onClose(),
      onCancel: () => onClose(),
      content: [<>
      <p>
          We're not really sure what went wrong here, please refresh your browser and try again.
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

