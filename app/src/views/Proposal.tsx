import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ResultProgressBar } from "../components/proposal/ResultProgressBar";
import { Button, Divider, Spin, Tag } from "antd";
import { ProposalCard } from "../components/ProposalCard";
import { VoterList } from "../components/proposal/VoterList";
import { useWallet } from "@solana/wallet-adapter-react";
import { VoteModal } from "../components/proposal/VoteModal";
import { useUser, useVoteRecord } from "../hooks/useClient";
import { USER_VOTE_HISTORY } from "../models/USER_VOTE_HISTORY";
import { TOP_STAKEHOLDERS } from "../models/TOP_STAKEHOLDERS";
import { INITIAL_STATE } from "../models/INITIAL_PROPOSALS";
import React from "react";
import {
  useGovernance,
  useProposal,
  useProposalsByGovernance,
  useTokenOwnerRecords,
  useVoteRecordsByProposal,
  useWalletTokenOwnerRecord,
  useInstructionsByProposal,
  useSignatoriesByProposal,
  useTokenOwnerVoteRecord,
} from "../hooks/apiHooks";
import { JET_GOVERNANCE, shortenAddress } from "../utils";
import { useProposalFilters, useVoterDisplayData, VoterDisplayData, VoteType } from "../hooks/proposalHooks";
import { useKeyParam } from "../hooks/useKeyParam";
import { useRealm } from "../contexts/GovernanceContext";
import { ParsedAccount, useMint } from "../contexts";
import { Governance, Proposal, Realm } from "../models/accounts";
import { MintInfo } from "@solana/spl-token";
import { useIsUrl, useLoadGist } from "../hooks/useLoadGist";
import { bnToIntLossy } from "../tools/units";
import { LABELS } from "../constants";
import ReactMarkdown from "react-markdown";
import { voteRecordCsvDownload } from "../actions/voteRecordCsvDownload";
import BN from "bn.js";

export const ProposalView = () => {
  const [inactive, setInactive] = useState(true);
  const [isVoteModalVisible, setIsVoteModalVisible] = useState(false);
  const [isStakeRedirectModalVisible, setIsStakeRedirectModalVisible] =
    useState(false);
  const [ifStaked, setIfStaked] = useState(false);
  const [vote, setVote] = useState("");

  // TODO: Fetch user's stake from blockchain
  const proposalAddress = useKeyParam();
  const proposal = useProposal(proposalAddress);

  let governance = useGovernance(proposal?.info.governance);
  let realm = useRealm(governance?.info.realm);

  const governingTokenMint = useMint(proposal?.info.governingTokenMint);

  const voteRecords = useVoteRecordsByProposal(proposal?.pubkey);

  const tokenOwnerRecords = useTokenOwnerRecords(
    governance?.info.realm,
    proposal?.info.isVoteFinalized() // TODO: for finalized votes show a single item for abstained votes
      ? undefined
      : proposal?.info.governingTokenMint,
  );

  const voterDisplayData = useVoterDisplayData(voteRecords, tokenOwnerRecords)

  const proposals = useProposalsByGovernance(JET_GOVERNANCE);
  const filteredProposals = useProposalFilters(proposals);
  const { connected } = useWallet();
  const { stakedBalance } = useUser();

  //TODO: Fix this temporary fix from the proposal being possibly undefined
  const proposalOld =
    INITIAL_STATE.find((proposal) => proposal.id == 0) ??
    INITIAL_STATE[0];

  const {
    start,
    end,
    type,
  } = proposalOld;
  const id = 0;

  useEffect(() => {
    if (end.getTime() > Date.now()) {
      setInactive(false);
    }
  }, [end]);

  useEffect(() => {
    if (stakedBalance !== 0) {
      return setIfStaked(true);
    }
  }, [stakedBalance]);

  const handleVoteModal = () => {
    if (!ifStaked) {
      return setIsStakeRedirectModalVisible(true);
    } else {
      return setIsVoteModalVisible(true);
    }
  };

  // Find matching user vote within USER_VOTE_HISTORY
  const userVote = USER_VOTE_HISTORY.find((x) => x.id === 0);

  return (
    <>
      {proposal && governance && governingTokenMint && realm ?
        <InnerProposalView
          proposal={proposal}
          governance={governance}
          realm={realm}
          governingTokenMint={governingTokenMint}
          voterDisplayData={voterDisplayData} /> :
        <Spin />}
    </>
  )

  function InnerProposalView(props: {
    proposal: ParsedAccount<Proposal>,
    governance: ParsedAccount<Governance>,
    realm: ParsedAccount<Realm>,
    governingTokenMint: MintInfo,
    voterDisplayData: VoterDisplayData[],
  }) {
    const {
      proposal,
      governance,
      realm,
      governingTokenMint,
      voterDisplayData
    } = props;

    const tokenOwnerRecord = useWalletTokenOwnerRecord(
      governance.info.realm,
      proposal.info.governingTokenMint,
    );
    const walletVoteRecordInfo = useTokenOwnerVoteRecord(proposal.pubkey, tokenOwnerRecord?.pubkey);
    let walletVoteRecord = walletVoteRecordInfo?.tryUnwrap()?.info.getVoterDisplayData();
    
    const instructions = useInstructionsByProposal(proposal.pubkey);
    const signatories = useSignatoriesByProposal(proposal.pubkey);

    const isDescriptionUrl = useIsUrl(proposal.info.descriptionLink);
    const isGist =
      !!proposal.info.descriptionLink.match(/gist/i) &&
      !!proposal.info.descriptionLink.match(/github/i);
    const [content, setContent] = useState(proposal.info.descriptionLink);
    const [loading, setLoading] = useState(isDescriptionUrl);
    const [failed, setFailed] = useState(false);
    const [msg, setMsg] = useState('');
    const [width, setWidth] = useState<number>();
    const [height, setHeight] = useState<number>();
    const addressStr = useMemo(() => proposalAddress.toBase58(), [proposalAddress]);
    const shortAddress = useMemo(() => shortenAddress(proposalAddress), [proposalAddress])
    const { yes, no, abstain, total, yesPercent, yesAbstainPercent } = proposal.info.getVoteCounts();

    useLoadGist({
      loading,
      setLoading,
      setFailed,
      setMsg,
      setContent,
      isGist,
      proposal,
    });

    return (<div className="view-container proposal flex column flex-start">
      <Link to="/">
        <i className="fas fa-arrow-left"></i> All Proposals
      </Link>

      <div className="view-container flex content">
        <div className="flex column" style={{ width: "70%" }}>
          <h2>Proposal Details</h2>
          <div className="description neu-container ">
            <div className="flex">
              <h3>Proposal {shortAddress}</h3>
            </div>
            <h1 className="view-header">{proposal.info.name}</h1>

            {/* Description; Github Gist or text */
              loading ? (
                <Spin />
              ) : isDescriptionUrl ? (
                failed ? (
                  <p>
                    {LABELS.DESCRIPTION}:{' '}
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
                content
              )
            }

            <div className="neu-inset flex column">
              <div>
                <span>Proposal ID:</span>
                <span>{addressStr}</span>
              </div>
              <div>
                <span>Type:</span>
                <span>{type.map((type) => <Tag>{type}</Tag>)}</span>
              </div>
              <div>
                <span>Start date:</span>
                <span>{start.toString()}</span>
              </div>
              <div>
                <span>End date:</span>
                <span>{end.toString()}</span>
              </div>
            </div>
          </div>

          <h2>Vote turnout</h2>
          <div className="neu-container flex justify-evenly" id="vote-turnout">
            <div className="results">
              <ResultProgressBar
                type="inFavor"
                amount={bnToIntLossy(yes)}
                total={bnToIntLossy(total)}
              />
              <ResultProgressBar
                type="against"
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
              <div className="flex justify-between">
                <span />
                <span onClick={() => voteRecordCsvDownload(proposal.pubkey, voterDisplayData)} id="csv">Download CSV</span>
              </div>
              <div className={`stakeholders`} >
                <span className="voter title"></span>
                <span className="address title">WALLET</span>
                <span className="amount title">vJET</span>
                <span className="vote title">VOTE</span>
              </div>
              <VoterList voteRecords={voterDisplayData} userVoteRecord={walletVoteRecord} />
            </div>
          </div>
        </div>

        <div className="flex column" style={{ width: "30%" }} id="vote-desktop">
          <h2>Your Vote</h2>
          <div
            className="neu-container view-container flex column"
            id="your-vote"
          >
            <Button
              onClick={() => setVote("inFavor")}
              disabled={(!connected || inactive)}
              className="vote-select"
            >
              In favor
            </Button>
            <Button
              onClick={() => setVote("against")}
              disabled={(!connected || inactive)}
              className="vote-select"
            >
              Against
            </Button>
            {/* <Button
              onClick={() => setVote("abstain")}
              disabled={(!connected || inactive)}
              className="vote-select"
            >
              Abstain
            </Button> */}
            <Button
              type="primary"
              disabled={(!connected || inactive)}
              onClick={handleVoteModal}
            >
              Vote
            </Button>
            <VoteModal
              vote={vote}
              isVoteModalVisible={isVoteModalVisible}
              setIsVoteModalVisible={setIsVoteModalVisible}
              isStakeRedirectModalVisible={isStakeRedirectModalVisible}
              setIsStakeRedirectModalVisible={setIsStakeRedirectModalVisible}
              proposalNumber={id}
              endDate={end}
            />
          </div>
        </div>
      </div>

      <Divider />

      <div className="other-proposals">
        <h3>Other active proposals</h3>
        <div className="flex">
          {filteredProposals.filter(otherProp => !otherProp.pubkey.equals(proposal.pubkey)).map((proposal: any) => (
            <ProposalCard
              proposal={proposal}
            />
          ))}
        </div>
      </div>
    </div>
    );
  }
};
