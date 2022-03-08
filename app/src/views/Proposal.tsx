import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ResultProgressBar } from "../components/proposal/ResultProgressBar";
import { Divider, Button } from "antd";
import { ProposalCard } from "../components/ProposalCard";
import { VoterList } from "../components/proposal/VoterList";
import { useWallet } from "@solana/wallet-adapter-react";
import { VoteModal } from "../components/modals/VoteModal";
import {
  useProposal,
  useTokenOwnerRecords,
  useVoteRecordsByProposal,
  useWalletTokenOwnerRecord,
  useTokenOwnerVoteRecord
} from "../hooks/apiHooks";
import {
  getVoteCounts,
  getVoteType,
  useCountdown,
  useVoterDisplayData,
  VoterDisplayData,
  VoteOption
} from "../hooks/proposalHooks";
import { useKeyParam } from "../hooks/useKeyParam";
import { useLoadGist } from "../hooks/useLoadGist";
import { bnToIntLossy } from "../tools/units";
import { LABELS } from "../constants";
import ReactMarkdown from "react-markdown";
import { voteRecordCsvDownload } from "../actions/voteRecordCsvDownload";
import { DownloadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { getPubkeyIndex } from "../models/PUBKEYS_INDEX";
import { useProposalContext } from "../contexts/proposal";
import { StakeAccount, StakeBalance, StakePool } from "@jet-lab/jet-engine";
import { Governance, ProgramAccount, Proposal, ProposalState } from "@solana/spl-governance";
import { explorerUrl } from "../utils";
import { ReactComponent as ThumbsUp } from "../images/thumbs_up.svg";
import { ReactComponent as ThumbsDown } from "../images/thumbs_down.svg";
import { Loader } from "../components/Loader";

export const ProposalView = () => {
  const proposalAddress = useKeyParam();
  const proposal = useProposal(proposalAddress);

  const voteRecords = useVoteRecordsByProposal(proposal?.pubkey);

  const { stakePool, stakeAccount, stakeBalance, governance, proposalsByGovernance } =
    useProposalContext();

  const tokenOwnerRecords = useTokenOwnerRecords(
    governance?.account.realm,
    proposal?.account.isVoteFinalized() // TODO: for finalized votes show a single item for abstained votes
      ? undefined
      : proposal?.account.governingTokenMint
  );

  const { allHasVoted } = useVoterDisplayData(voteRecords, tokenOwnerRecords);

  return proposal && governance && stakePool && proposalsByGovernance ? (
    <InnerProposalView
      proposal={proposal}
      governance={governance}
      voterDisplayData={allHasVoted}
      stakePool={stakePool}
      stakeAccount={stakeAccount}
      stakeBalance={stakeBalance}
      proposalsByGovernance={proposalsByGovernance}
    />
  ) : (
    <Loader />
  );
};

const InnerProposalView = ({
  proposal,
  governance,
  voterDisplayData,
  stakePool,
  stakeAccount,
  stakeBalance,
  proposalsByGovernance
}: {
  proposal: ProgramAccount<Proposal>;
  governance: ProgramAccount<Governance>;
  voterDisplayData: VoterDisplayData[];
  stakePool: StakePool;
  stakeAccount: StakeAccount | undefined;
  stakeBalance: StakeBalance;
  proposalsByGovernance: ProgramAccount<Proposal>[];
}) => {
  const [isVoteModalVisible, setIsVoteModalVisible] = useState(false);

  const tokenOwnerRecord = useWalletTokenOwnerRecord(
    governance.account.realm,
    proposal.account.governingTokenMint
  );
  const voteRecord = useTokenOwnerVoteRecord(proposal.pubkey, tokenOwnerRecord?.pubkey);

  const handleVoteModal = () => {
    setIsVoteModalVisible(true);
  };

  const { connected } = useWallet();

  // FIXME!
  const isStaked = true;
  // const isStaked = stakedJet !== undefined && stakedJet > 0;

  const activeProposals = proposalsByGovernance.filter(
    p => p.account.state === ProposalState.Voting
  );

  const proposalAddress = useKeyParam();

  const [vote, setVote] = useState<VoteOption>(VoteOption.Undecided);
  useEffect(() => {
    setVote(getVoteType(voteRecord?.account.vote?.voteType));
  }, [voteRecord]);

  const addressStr = useMemo(() => proposalAddress.toBase58(), [proposalAddress]);
  const { yes, no, total } = getVoteCounts(proposal);
  const { startDate, endDate } = useCountdown(proposal, governance);

  const {
    loading,
    failed,
    msg,
    content,
    isUrl: isDescriptionUrl
  } = useLoadGist(proposal.account.descriptionLink);

  let errorMessage = "";
  if (!connected) {
    errorMessage = "Connect your Solana wallet to get started.";
  } else if (!isStaked && connected) {
    errorMessage = "You must have JET staked in order to vote on proposals.";
  } else if (vote === undefined && connected) {
    errorMessage = "Please select an option to submit your vote.";
  }

  return (
    <div className="view-container column-grid" id="proposal-page">
      <h2 className="mobile-only">Proposal detail</h2>
      <div
        className={`flex column ${
          proposal.account.state === ProposalState.Voting ? "proposal-left" : "centered"
        }`}
      >
        <div className="description neu-container">
          <span>
            <Link to="/">
              <ArrowLeftOutlined />
              Active Proposals
            </Link>{" "}
            / Jet Upward Momentum Proposal {getPubkeyIndex(addressStr)}
          </span>
          <h1 className="view-header">{proposal.account.name}</h1>
          {
            /* Description; Github Gist or text */
            loading ? (
              <Loader />
            ) : isDescriptionUrl ? (
              failed ? (
                <p>
                  {LABELS.DESCRIPTION}:{" "}
                  <a
                    href={proposal.account.descriptionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {msg ? msg : LABELS.NO_LOAD}
                  </a>
                </p>
              ) : (
                <ReactMarkdown children={content} />
              )
            ) : (
              <p>{content}</p>
            )
          }
          <div className="neu-inset" id="details">
            <span>Proposal ID</span>
            <span>
              <a href={explorerUrl(addressStr)} target="_blank" rel="noreferrer">
                {addressStr}
              </a>
            </span>
            <span>Start date</span>
            <span> {startDate ? startDate : "To be determined."}</span>
            <span>End date</span>
            <span>{endDate ? endDate : "To be determined"}</span>
          </div>
        </div>

        <div className="neu-container flex column">
          <div className="flex">
            <h1>Vote Turnout</h1>
            <span onClick={() => voteRecordCsvDownload(proposal.pubkey, voterDisplayData)} id="csv">
              Download CSV <DownloadOutlined />
            </span>
          </div>

          <div className="flex justify-evenly" id="vote-turnout">
            <div className="results">
              <ResultProgressBar
                type="Approve"
                amount={bnToIntLossy(yes)}
                total={bnToIntLossy(total)}
              />
              <ResultProgressBar
                type="Reject"
                amount={bnToIntLossy(no)}
                total={bnToIntLossy(total)}
              />
              {/* <ResultProgressBar
                type="abstain"
                amount={bnToIntLossy(abstain)}
                total={bnToIntLossy(total)}
              /> */}
            </div>

            <Divider className="mobile-only" />

            <div className="voters">
              <div className="mobile-only">
                <p>See additional voter information and download a full CSV on the desktop app.</p>
              </div>
              <div className={`stakeholders`}>
                <span className="voter title"></span>
                <span className="address title">Wallet</span>
                <span className="amount title">Stake</span>
                <span className="vote title">Vote</span>
              </div>
              <VoterList voteRecords={voterDisplayData} userVoteRecord={voteRecord} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex column proposal-right">
        <div
          className={`neu-container flex column ${
            proposal.account.state !== ProposalState.Voting && "hidden"
          }`}
          id="your-vote"
        >
          <Button
            onClick={() => setVote(VoteOption.Yes)}
            className={`vote-select ${vote === VoteOption.Yes ? "selected" : ""}`}
            size="large"
          >
            In favor
            <ThumbsUp className="mobile-only" />
          </Button>
          <Button
            onClick={() => setVote(VoteOption.No)}
            className={`vote-select ${vote === VoteOption.No ? "selected" : ""}`}
            size="large"
          >
            Against
            <ThumbsDown className="mobile-only" />
          </Button>
          <Button
            type="primary"
            onClick={() => handleVoteModal()}
            disabled={(connected && !isStaked) || (connected && vote === undefined) || !connected}
          >
            Vote
          </Button>
          <VoteModal
            vote={vote}
            visible={isVoteModalVisible}
            onClose={() => setIsVoteModalVisible(false)}
            governance={governance}
            proposal={proposal}
            tokenOwnerRecord={tokenOwnerRecord}
            voteRecord={voteRecord}
            stakeBalance={stakeBalance}
          />
          <span className="helper-text">{errorMessage}</span>
        </div>
      </div>

      <Divider className={proposal.account.state === ProposalState.Voting ? "" : "centered"} />

      <div
        className={`other-proposals ${
          proposal.account.state === ProposalState.Voting ? "" : "centered"
        }`}
      >
        <h3>Other active proposals</h3>
        <div className="flex">
          {activeProposals.length > 0
            ? activeProposals.map(proposal => (
                <ProposalCard
                  proposal={proposal}
                  governance={governance}
                  key={proposal.pubkey.toBase58()}
                />
              ))
            : "There are no active proposals at this time."}
        </div>
      </div>
      <Link to="/" className="mobile-only">
        <ArrowLeftOutlined />
        Active Proposals
      </Link>
    </div>
  );
};
