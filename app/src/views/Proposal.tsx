import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ResultProgressBar } from "../components/proposal/ResultProgressBar";
import { Button, Divider, Typography } from "antd";
import { ProposalCard } from "../components/ProposalCard";
import { VoterList } from "../components/proposal/VoterList";
import { useWallet } from "@solana/wallet-adapter-react";
import { VoteModal } from "../components/modals/VoteModal";
import {
  getVoteCounts,
  getVoteType,
  getVotingDeadline,
  useCountdown,
  useKeyParam,
  useLoadGist,
  useProposal,
  useTokenOwnerRecords,
  useTokenOwnerVoteRecord,
  useVoterDisplayData,
  useVoteRecordsByProposal,
  useWalletTokenOwnerRecord,
  VoteOption,
  VoterDisplayData
} from "../hooks";
import { bnToIntLossy } from "../tools/units";
import { LABELS } from "../constants";
import ReactMarkdown from "react-markdown";
import { voteRecordCsvDownload } from "../actions/voteRecordCsvDownload";
import { ArrowLeftOutlined, DownloadOutlined } from "@ant-design/icons";
import { getPubkeyIndex } from "../models/PUBKEYS_INDEX";
import { useProposalContext } from "../contexts/proposal";
import { StakeBalance } from "@jet-lab/jet-engine";
import { Governance, ProgramAccount, Proposal, ProposalState, Realm } from "@solana/spl-governance";
import { ReactComponent as ThumbsUp } from "../images/thumbs_up.svg";
import { ReactComponent as ThumbsDown } from "../images/thumbs_down.svg";
import { Loader } from "../components/Loader";
import { getExplorerUrl } from "../utils";
import "./Proposal.less";
import { useDarkTheme } from "../contexts/darkTheme";

export const ProposalView = () => {
  const proposalAddress = useKeyParam();
  const proposal = useProposal(proposalAddress);

  const voteRecords = useVoteRecordsByProposal(proposal?.pubkey);

  const { stakeBalance, realm, governance, proposalsByGovernance } = useProposalContext();

  const tokenOwnerRecords = useTokenOwnerRecords(
    governance?.account.realm,
    proposal?.account.isVoteFinalized() // TODO: for finalized votes show a single item for abstained votes
      ? undefined
      : proposal?.account.governingTokenMint
  );

  const { allHasVoted } = useVoterDisplayData(voteRecords, tokenOwnerRecords);

  return proposal && realm && governance && proposalsByGovernance ? (
    <InnerProposalView
      proposal={proposal}
      realm={realm}
      governance={governance}
      voterDisplayData={allHasVoted}
      stakeBalance={stakeBalance}
      proposalsByGovernance={proposalsByGovernance}
    />
  ) : (
    <Loader />
  );
};

const InnerProposalView = ({
  proposal,
  realm,
  governance,
  voterDisplayData,
  stakeBalance,
  proposalsByGovernance
}: {
  proposal: ProgramAccount<Proposal>;
  realm: ProgramAccount<Realm>;
  governance: ProgramAccount<Governance>;
  voterDisplayData: VoterDisplayData[];
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
  const { jetMint } = useProposalContext();

  // FIXME!
  const isStaked = true;
  const deadlineTimestamp = Date.now() / 1000;
  const deadline = getVotingDeadline(proposal, governance);
  const hasDeadlineLapsed = deadline ? deadlineTimestamp > deadline.toNumber() : false;

  const otherActiveProposals = proposalsByGovernance.filter(p => {
    const deadline = getVotingDeadline(p, governance);
    const hasDeadlineLapsed = deadline ? deadlineTimestamp > deadline.toNumber() : false;
    return (
      !p.pubkey.equals(proposal.pubkey) &&
      p.account.state === ProposalState.Voting &&
      !hasDeadlineLapsed
    );
  });

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
  const { darkTheme } = useDarkTheme();
  const hasBorder = !darkTheme ? "no-border" : "";
  const { Title, Text, Paragraph } = Typography;
  return (
    <Typography>
      <div className="view-container column-grid" id="proposal-page">
        <Title level={2} className="mobile-only">
          Proposal detail
        </Title>
        <div
          className={`flex column ${
            proposal.account.state === ProposalState.Voting && !hasDeadlineLapsed
              ? "proposal-left"
              : "centered"
          }`}
        >
          <div className="description neu-container">
            <Text>
              <Link to="/">
                <ArrowLeftOutlined />
                Active Proposals
              </Link>{" "}
              / Jet Upward Momentum Proposal {getPubkeyIndex(addressStr)}
            </Text>
            <Title className="description-title">{proposal.account.name}</Title>
            {loading ? (
              <Loader />
            ) : isDescriptionUrl ? (
              failed ? (
                <Paragraph className="description-text">
                  {LABELS.DESCRIPTION}:{" "}
                  <a
                    href={proposal.account.descriptionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {msg ? msg : LABELS.NO_LOAD}
                  </a>
                </Paragraph>
              ) : (
                <ReactMarkdown className="description-text" children={content} />
              )
            ) : (
              <Paragraph className="description-text">{content}</Paragraph>
            )}
            <div className="neu-inset details">
              <Text>Proposal ID</Text>
              <Text>
                <a href={getExplorerUrl(addressStr, "account")} target="_blank" rel="noreferrer">
                  {addressStr}
                </a>
              </Text>
              <Text>Start date</Text>
              <Text> {startDate ? startDate : "To be determined."}</Text>
              <Text>End date</Text>
              <Text>{endDate ? endDate : "To be determined"}</Text>
            </div>
          </div>

          <div className="neu-container flex column">
            <div className="flex">
              <Title>Vote Turnout</Title>
              <Text
                onClick={() => voteRecordCsvDownload(proposal.pubkey, voterDisplayData, jetMint)}
                id="csv"
              >
                Download CSV <DownloadOutlined />
              </Text>
            </div>

            <div className="flex justify-evenly vote-turnout">
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
              </div>

              <Divider className="mobile-only" />

              <div className="voters">
                <div className="mobile-only">
                  <Paragraph>
                    See additional voter information and download a full CSV on the desktop app.
                  </Paragraph>
                </div>
                <div className={`stakeholders`}>
                  <span className="voter title" />
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
          {!(proposal.account.state !== ProposalState.Voting || hasDeadlineLapsed) && (
            <div className={`neu-container flex column`} id="your-vote">
              <Button
                onClick={() => setVote(VoteOption.Yes)}
                className={`vote-select vote-btn ${vote === VoteOption.Yes ? "selected" : ""}`}
                size="large"
              >
                In favor
                <ThumbsUp className="mobile-only" />
              </Button>
              <Button
                onClick={() => setVote(VoteOption.No)}
                className={`vote-select vote-btn ${vote === VoteOption.No ? "selected" : ""}`}
                size="large"
              >
                Against
                <ThumbsDown className="mobile-only" />
              </Button>
              <Button
                type="primary"
                onClick={() => handleVoteModal()}
                disabled={
                  (connected && !isStaked) || (connected && vote === undefined) || !connected
                }
              >
                Vote
              </Button>
              {isVoteModalVisible && (
                <VoteModal
                  vote={vote}
                  onClose={() => setIsVoteModalVisible(false)}
                  realm={realm}
                  governance={governance}
                  proposal={proposal}
                  voteRecord={voteRecord}
                  stakeBalance={stakeBalance}
                />
              )}
              <span className="helper-text">{errorMessage}</span>
            </div>
          )}
        </div>

        <Divider
          className={
            proposal.account.state === ProposalState.Voting && !hasDeadlineLapsed ? "" : "centered"
          }
        />

        <div
          className={`other-proposals ${
            proposal.account.state === ProposalState.Voting && !hasDeadlineLapsed ? "" : "centered"
          }`}
        >
          <h3>Other active proposals</h3>
          <div className="flex">
            {otherActiveProposals.length > 0
              ? otherActiveProposals.map(proposal => (
                  <ProposalCard
                    proposal={proposal}
                    governance={governance}
                    key={proposal.pubkey.toBase58()}
                  />
                ))
              : "There are no other proposals at this time."}
          </div>
        </div>
        <Link to="/" className="mobile-only">
          <ArrowLeftOutlined />
          Active Proposals
        </Link>
      </div>
    </Typography>
  );
};
