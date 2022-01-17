import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ResultProgressBar } from "../components/proposal/ResultProgressBar";
import { Divider, Spin, Button, Tooltip } from "antd";
import { ProposalCard } from "../components/ProposalCard";
import { VoterList } from "../components/proposal/VoterList";
import { useWallet } from "@solana/wallet-adapter-react";
import { VoteModal } from "../components/modals/VoteModal";
import React from "react";
import {
  useGovernance,
  useProposal,
  useProposalsByGovernance,
  useTokenOwnerRecords,
  useVoteRecordsByProposal,
  useWalletTokenOwnerRecord,
  useTokenOwnerVoteRecord,
} from "../hooks/apiHooks";
import {
  fromLamports,
  JET_GOVERNANCE,
  shortenAddress,
  JET_TOKEN_MINT,
} from "../utils";
import {
  useCountdown,
  useProposalFilters,
  useVoterDisplayData,
  VoterDisplayData,
} from "../hooks/proposalHooks";
import { useKeyParam } from "../hooks/useKeyParam";
import { useRealm } from "../contexts/GovernanceContext";
import { ParsedAccount, useMint } from "../contexts";
import { Governance, Proposal, Realm } from "../models/accounts";
import { MintInfo } from "@solana/spl-token";
import { useLoadGist } from "../hooks/useLoadGist";
import { bnToIntLossy } from "../tools/units";
import { LABELS } from "../constants";
import ReactMarkdown from "react-markdown";
import { voteRecordCsvDownload } from "../actions/voteRecordCsvDownload";
import { StakeRedirectModal } from "../components/modals/StakeRedirectModal";
import { YesNoVote } from "../models/instructions";
import { useHasVoteTimeExpired } from "../hooks/useHasVoteTimeExpired";
import { DownloadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useConnectWallet } from "../contexts/connectWallet";
import { getPubkeyIndex } from "../models/PUBKEYS_INDEX";
import {
  useStakeAccount,
  useStakedBalance,
  useStakePool,
  useStakeProgram,
} from "../hooks/useStaking";
import { FooterLinks } from "../components/FooterLinks";

export const ProposalView = () => {
  const [isVoteModalVisible, setIsVoteModalVisible] = useState(false);
  const [vote, setVote] = useState<YesNoVote | undefined>(undefined);

  const proposalAddress = useKeyParam();
  const proposal = useProposal(proposalAddress);
  const { setConnecting } = useConnectWallet();

  let governance = useGovernance(proposal?.info.governance);
  let realm = useRealm(governance?.info.realm);

  const governingTokenMint = useMint(JET_TOKEN_MINT);

  const voteRecords = useVoteRecordsByProposal(proposal?.pubkey);

  const tokenOwnerRecords = useTokenOwnerRecords(
    governance?.info.realm,
    proposal?.info.isVoteFinalized() // TODO: for finalized votes show a single item for abstained votes
      ? undefined
      : proposal?.info.governingTokenMint
  );

  const { allHasVoted } = useVoterDisplayData(voteRecords, tokenOwnerRecords);

  const proposals = useProposalsByGovernance(JET_GOVERNANCE);
  const activeProposals = proposals.filter((p) => p.info.isVoting());

  const stakeProgram = useStakeProgram();
  const stakePool = useStakePool(stakeProgram);
  const stakeAccount = useStakeAccount(stakeProgram, stakePool);

  const { connected } = useWallet();
  const { stakedJet } = useStakedBalance(stakeAccount, stakePool);
  const isStaked = stakedJet !== undefined && stakedJet > 0;

  const handleVoteModal = () => {
    setIsVoteModalVisible(true);
  };

  return proposal && governance && governingTokenMint && realm ? (
    <InnerProposalView
      proposal={proposal}
      governance={governance}
      realm={realm}
      governingTokenMint={governingTokenMint}
      voterDisplayData={allHasVoted}
    />
  ) : (
    <Spin />
  );

  function InnerProposalView(props: {
    proposal: ParsedAccount<Proposal>;
    governance: ParsedAccount<Governance>;
    realm: ParsedAccount<Realm>;
    governingTokenMint: MintInfo;
    voterDisplayData: VoterDisplayData[];
  }) {
    const {
      proposal,
      governance,
      // realm,
      // governingTokenMint,
      voterDisplayData,
    } = props;

    const tokenOwnerRecord = useWalletTokenOwnerRecord(
      governance.info.realm,
      proposal.info.governingTokenMint
    );
    const voteRecord = useTokenOwnerVoteRecord(
      proposal.pubkey,
      tokenOwnerRecord?.pubkey
    );

    useEffect(() => {
      if (
        voteRecord?.tryUnwrap()?.info.getVoterDisplayData().group === "Approve"
      ) {
        setVote(YesNoVote.Yes);
      } else if (
        voteRecord?.tryUnwrap()?.info.getVoterDisplayData().group === "Reject"
      ) {
        setVote(YesNoVote.No);
      }
      // else if (
      //   voteRecord?.tryUnwrap()?.info.getVoterDisplayData().group === "Abstain"
      // ) {
      //   setVote(YesNoVote.Abstain);
      // }
    }, [voteRecord]);

    // const instructions = useInstructionsByProposal(proposal.pubkey);
    // const signatories = useSignatoriesByProposal(proposal.pubkey);

    const addressStr = useMemo(
      () => proposalAddress.toBase58(),
      [proposalAddress]
    );
    const { yes, no, abstain, total, yesPercent, yesAbstainPercent } =
      proposal.info.getVoteCounts();
    const { startDate, endDate } = useCountdown(proposal.info, governance.info);

    const {
      loading,
      failed,
      msg,
      content,
      isUrl: isDescriptionUrl,
    } = useLoadGist(proposal.info.descriptionLink);

    return (
      <div className="view-container proposal column-grid">
        <div
          className={`flex column ${
            proposal.info.isVoting() ? "proposal-left" : "centered"
          }`}
        >
          <div className="description neu-container">
            <span>
              <Link to="/">
                <ArrowLeftOutlined />
                Active Proposals
              </Link>{" "}
              / JUMP {getPubkeyIndex(addressStr)}
            </span>
            <h1 className="view-header">{proposal.info.name}</h1>
            {
              /* Description; Github Gist or text */
              loading ? (
                <Spin />
              ) : isDescriptionUrl ? (
                failed ? (
                  <p>
                    {LABELS.DESCRIPTION}:{" "}
                    <a
                      href={proposal.info.descriptionLink}
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
              <span>{addressStr}</span>
              <span>Start date</span>
              <span> {startDate ? startDate : "To be determined."}</span>
              <span>End date</span>
              <span>{endDate ? endDate : "To be determined"}</span>
            </div>
          </div>

          <div className="neu-container flex column">
            <div className="flex">
              <h1>Vote Turnout</h1>
              <span
                onClick={() =>
                  voteRecordCsvDownload(proposal.pubkey, voterDisplayData)
                }
                id="csv"
              >
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
                <ResultProgressBar
                  type="abstain"
                  amount={bnToIntLossy(abstain)}
                  total={bnToIntLossy(total)}
                />
              </div>

              <div className="voters">
                <div className={`stakeholders`}>
                  <span className="voter title"></span>
                  <span className="address title">Wallet</span>
                  <span className="amount title">Stake</span>
                  <span className="vote title">Vote</span>
                </div>
                <VoterList
                  voteRecords={voterDisplayData}
                  userVoteRecord={voteRecord
                    ?.tryUnwrap()
                    ?.info.getVoterDisplayData()}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex column proposal-right">
          <div
            className={`neu-container flex column ${
              !proposal.info.isVoting() && "hidden"
            }`}
            id="your-vote"
          >
            <Button
              onClick={() => setVote(YesNoVote.Yes)}
              className={`vote-select ${
                vote === YesNoVote.Yes ? "selected" : ""
              }`}
              size="large"
            >
              In favor
            </Button>
            <Button
              onClick={() => setVote(YesNoVote.No)}
              className={`vote-select ${
                vote === YesNoVote.No ? "selected" : ""
              }`}
              size="large"
            >
              Against
            </Button>
            <Button
              onClick={() => console.log(vote)}
              className={`vote-select`}
              size="large"
            >
              Abstain
            </Button>
              <Button
                type="primary"
                onClick={
                  !connected
                    ? () => setConnecting(true)
                    : () => handleVoteModal()
                }
              size="large"
              disabled={!isStaked || vote === undefined}
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
              stakeAccount={stakeAccount}
              stakePool={stakePool}
            />
            {!isStaked && connected ? <span className="secondary-text">You must have staked JET in order to vote on proposals.</span> : vote === undefined && connected ? <span className="secondary-text">Please select an option to submit your vote.</span> : ""}
          </div>
        </div>

        <Divider className={proposal.info.isVoting() ? "" : "centered"} />

        <div
          className={`other-proposals ${
            proposal.info.isVoting() ? "" : "centered"
          }`}
        >
          <h3>Other active proposals</h3>
          <div className="flex">
            {activeProposals.length > 0
              ? activeProposals.map((proposal) => (
                  <ProposalCard
                    proposal={proposal}
                    governance={governance}
                    key={proposal.pubkey.toBase58()}
                  />
                ))
              : "There are no active proposals at this time."}
          </div>
          <FooterLinks />
        </div>
      </div>
    );
  }
};
