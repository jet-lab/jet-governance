import "./Proposal.less";
import { ArrowLeftOutlined, DownloadOutlined, InfoCircleFilled } from "@ant-design/icons";
import { bnToNumber, StakeBalance } from "@jet-lab/jet-engine";
import { Governance, ProgramAccount, Proposal, ProposalState, Realm } from "@solana/spl-governance";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button, Divider, Popover, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { voteRecordCsvDownload } from "../actions/voteRecordCsvDownload";
import { ProposalCard } from "../components";
import { VoteModal } from "../components/modals";
import { ResultProgressBar, VoterList } from "../components/proposal";
import { LABELS } from "../constants";
import { useBlockExplorer, useConnectionConfig, useProposalContext } from "../contexts";
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
import { ReactComponent as ThumbsUp } from "../images/thumbs_up.svg";
import { ReactComponent as ThumbsDown } from "../images/thumbs_down.svg";
import { getPubkeyIndex } from "../models/PUBKEYS_INDEX";
import { sharesToTokens } from "../utils";

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

  return (
    <InnerProposalView
      proposal={proposal}
      realm={realm}
      governance={governance}
      voterDisplayData={allHasVoted}
      stakeBalance={stakeBalance}
      proposalsByGovernance={proposalsByGovernance}
    />
  );
};

const RenderContent = ({
  proposal,
  gistInfo
}: {
  proposal: ProgramAccount<Proposal> | undefined;
  gistInfo: {
    loading: boolean;
    failed: boolean | undefined;
    msg: string | undefined;
    content: string | undefined;
    isUrl: boolean;
  };
}) => {
  const { Paragraph } = Typography;

  if (gistInfo.isUrl) {
    if (gistInfo.failed) {
      return (
        //when fetching fails
        <Paragraph className="description-text">
          {LABELS.DESCRIPTION}:{" "}
          <a href={proposal?.account.descriptionLink} target="_blank" rel="noopener noreferrer">
            {gistInfo.msg ? gistInfo.msg : LABELS.NO_LOAD}
          </a>
        </Paragraph>
      );
    } else {
      //when there's description
      return (
        <ReactMarkdown
          className="description-text"
          children={gistInfo.content ? gistInfo.content : "&mdash; &mdash; &mdash; "}
        />
      );
    }
  } else {
    //When there's no description at all
    return (
      <Paragraph className="description-text">
        {gistInfo.content ? gistInfo.content : "- - - No Proposal Description - - -"}
      </Paragraph>
    );
  }
};

const InnerProposalView = ({
  proposal,
  realm,
  governance,
  voterDisplayData,
  stakeBalance,
  proposalsByGovernance
}: {
  proposal: ProgramAccount<Proposal> | undefined;
  realm: ProgramAccount<Realm> | undefined;
  governance: ProgramAccount<Governance> | undefined;
  voterDisplayData: VoterDisplayData[] | undefined;
  stakeBalance: StakeBalance | undefined;
  proposalsByGovernance: ProgramAccount<Proposal>[] | undefined;
}) => {
  const loaded = !!(proposal && realm && governance && proposalsByGovernance);

  const { Title, Text, Paragraph } = Typography;
  const handleVoteModal = () => {
    setIsVoteModalVisible(true);
  };

  const [isVoteModalVisible, setIsVoteModalVisible] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const tokenOwnerRecord = useWalletTokenOwnerRecord(
    governance?.account.realm,
    proposal?.account.governingTokenMint
  );
  const voteRecord = useTokenOwnerVoteRecord(proposal?.pubkey, tokenOwnerRecord?.pubkey);
  const { connected } = useWallet();
  const { jetMint, stakePool } = useProposalContext();
  const { getAccountExplorerUrl } = useBlockExplorer();
  const proposalAddress = useKeyParam();
  const { startDate, endDate } = useCountdown(proposal, governance);
  const { inDevelopment } = useConnectionConfig();

  //if !loaded then use placeholder data
  const gistInfo = useLoadGist(proposal?.account.descriptionLink);

  const addressStr = useMemo(() => proposalAddress.toBase58(), [proposalAddress]);
  const [vote, setVote] = useState<VoteOption>(VoteOption.Undecided);
  useEffect(() => {
    setVote(getVoteType(voteRecord?.account.vote?.voteType));
  }, [voteRecord]);

  const isStaked = stakeBalance && stakeBalance.stakedJet && !stakeBalance.stakedJet.isZero();

  const deadlineTimestamp = Date.now() / 1000;
  const deadline = proposal && governance ? getVotingDeadline(proposal, governance) : undefined;
  const hasDeadlineLapsed = deadline ? deadlineTimestamp > deadline.toNumber() : false;
  const voteCounts = proposal ? getVoteCounts(proposal) : undefined;
  const otherActiveProposals = proposalsByGovernance?.filter(p => {
    if (!proposal) {
      return undefined;
    }
    const deadline = proposal && governance ? getVotingDeadline(p, governance) : undefined;
    const hasDeadlineLapsed = deadline ? deadlineTimestamp > deadline.toNumber() : false;
    return (
      !p.pubkey.equals(proposal.pubkey) &&
      p.account.state === ProposalState.Voting &&
      !hasDeadlineLapsed
    );
  });

  let errorMessage = "";
  if (!connected) {
    errorMessage = "Connect your Solana wallet to get started.";
  } else if (!isStaked && connected) {
    errorMessage = "You must have JET staked in order to vote on proposals.";
  } else if (vote === undefined && connected) {
    errorMessage = "Please select an option to submit your vote.";
  }

  return (
    <Typography>
      <div className="view column-grid" id="proposal-page">
        <Title level={2} className="mobile-only">
          Proposal detail
        </Title>
        <div
          className={`flex column ${
            loaded && proposal.account.state === ProposalState.Voting && !hasDeadlineLapsed
              ? "proposal-left"
              : "centered"
          }`}
        >
          {/* Proposal Card Detail */}
          <div className="description neu-container">
            <Text>
              <Link to="/">
                <ArrowLeftOutlined />
                Active Proposals
              </Link>{" "}
              / Jet DAO Advancement Proposal{" "}
              {addressStr ? getPubkeyIndex(addressStr, inDevelopment) : "---"}
            </Text>

            {/* Proposal Title */}
            <Title className="description-title">{loaded ? proposal.account.name : "---"}</Title>

            {/* Main Proposal Content */}
            {gistInfo && <RenderContent proposal={proposal} gistInfo={gistInfo} />}

            {/* Proposal Address and Dates */}
            <div className="neu-inset details">
              <Text>Proposal ID</Text>
              <Text>
                <a href={getAccountExplorerUrl(addressStr)} target="_blank" rel="noreferrer">
                  {loaded ? addressStr : "---"}
                </a>
              </Text>
              <Text>Start date</Text>
              <Text> {startDate ? startDate : "To be determined."}</Text>
              <Text>End date</Text>
              <Text>{endDate ? endDate : "To be determined"}</Text>
            </div>
          </div>

          {/* Proposal Results */}
          <div className="neu-container flex column">
            <div className="flex">
              <Title>Vote Results</Title>
              <Text
                onClick={() => {
                  if (loaded && voterDisplayData && stakePool) {
                    voteRecordCsvDownload(proposal.pubkey, voterDisplayData, stakePool, jetMint);
                  }
                }}
                id="csv"
                className="text-btn"
              >
                Download CSV <DownloadOutlined />
              </Text>
            </div>
            <div className="flex justify-evenly vote-turnout">
              <div className="results">
                <ResultProgressBar
                  type="Approve"
                  amount={bnToNumber(voteCounts?.yes)}
                  total={bnToNumber(voteCounts?.total)}
                />
                <ResultProgressBar
                  type="Reject"
                  amount={bnToNumber(voteCounts?.no)}
                  total={bnToNumber(voteCounts?.total)}
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
                  <span className="amount title">Staked JET</span>
                  <span className="vote title">Vote</span>
                </div>
                <VoterList voteRecords={voterDisplayData} userVoteRecord={voteRecord} />
              </div>
            </div>

            <div>
              <span>
                Votes per JET{" "}
                <Popover
                  content={
                    <div className="flex column">
                      <p>
                        Votes per JET is used to track the amount of voting power each account has.
                        The downloadable CSV tracks both values.
                      </p>
                      <span className="link-btn" onClick={() => setPopoverVisible(false)}>
                        Close
                      </span>
                    </div>
                  }
                  title="Votes per JET"
                  visible={popoverVisible}
                  trigger="click"
                >
                  <InfoCircleFilled onClick={() => setPopoverVisible(true)} />
                </Popover>{" "}
                = {bnToNumber(sharesToTokens(undefined, stakePool).conversion)}
              </span>
            </div>
          </div>
        </div>

        {/* If voting is in progress */}
        <div className="flex column proposal-right">
          {!(proposal?.account.state !== ProposalState.Voting || hasDeadlineLapsed) && loaded && (
            <div className={`neu-container flex column`} id="your-vote">
              <Button
                disabled={
                  (connected && !isStaked) || (connected && vote === undefined) || !connected
                }
                onClick={() => setVote(VoteOption.Yes)}
                className={`vote-select vote-btn ${vote === VoteOption.Yes ? "selected" : ""}`}
                type="primary"
              >
                <span className="gradient-text">In favor</span>
                <ThumbsUp className="mobile-only" />
              </Button>
              <Button
                disabled={
                  (connected && !isStaked) || (connected && vote === undefined) || !connected
                }
                onClick={() => setVote(VoteOption.No)}
                className={`vote-select vote-btn ${vote === VoteOption.No ? "selected" : ""}`}
                type="primary"
              >
                <span className="gradient-text">Against</span>
                <ThumbsDown className="mobile-only" />
              </Button>
              <Button
                disabled={
                  (connected && !isStaked) || (connected && vote === undefined) || !connected
                }
                type="primary"
                onClick={() => handleVoteModal()}
              >
                Vote
              </Button>
              {stakeBalance && loaded && isVoteModalVisible && (
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
            loaded && proposal.account.state === ProposalState.Voting && !hasDeadlineLapsed
              ? ""
              : "centered"
          }
        />

        <div
          className={`other-proposals ${
            loaded && proposal.account.state === ProposalState.Voting && !hasDeadlineLapsed
              ? ""
              : "centered"
          }`}
        >
          <h1>Other Proposals</h1>
          <div className="flex">
            {otherActiveProposals && loaded && otherActiveProposals.length > 0
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
