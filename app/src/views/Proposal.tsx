import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ResultProgressBar } from "../components/proposal/ResultProgressBar";
import { Divider, Spin, Tag, Button } from "antd";
import { ProposalCard } from "../components/ProposalCard";
import { VoterList } from "../components/proposal/VoterList";
import { useWallet } from "@solana/wallet-adapter-react";
import { VoteModal } from "../components/proposal/VoteModal";
import { useUser } from "../hooks/useClient";
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
import { JET_GOVERNANCE, shortenAddress } from "../utils";
import { useCountdown, useProposalFilters, useVoterDisplayData, VoterDisplayData } from "../hooks/proposalHooks";
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
import { StakeRedirectModal } from "../components/Stake/StakeRedirectModal";
import { YesNoVote } from "../models/instructions";
import { RelinquishVoteButton } from "./proposal/components/buttons/relinquishVoteButton";
import { CastVoteButton } from "./proposal/components/buttons/castVoteButton";
import { useHasVoteTimeExpired } from "../hooks/useHasVoteTimeExpired";

export const ProposalView = () => {
  const [inactive, setInactive] = useState(true);
  const [isVoteModalVisible, setIsVoteModalVisible] = useState(false);
  const [isStakeRedirectModalVisible, setIsStakeRedirectModalVisible] = useState(false);
  const [vote, setVote] = useState<YesNoVote>(YesNoVote.No);

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
  const isStaked = stakedBalance > 0;

  const handleVoteModal = () => {
    setIsVoteModalVisible(true); // Fixme!
    // if (!isStaked) {
    //   setIsStakeRedirectModalVisible(true);
    // } else {
    //   setIsVoteModalVisible(true);
    // }
  };

  return proposal && governance && governingTokenMint && realm ?
    <InnerProposalView
      proposal={proposal}
      governance={governance}
      realm={realm}
      governingTokenMint={governingTokenMint}
      voterDisplayData={voterDisplayData} /> :
    <Spin />

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
      // realm,
      // governingTokenMint,
      voterDisplayData
    } = props;

    const tokenOwnerRecord = useWalletTokenOwnerRecord(
      governance.info.realm,
      proposal.info.governingTokenMint,
    );
    const voteRecord = useTokenOwnerVoteRecord(proposal.pubkey, tokenOwnerRecord?.pubkey);
    const hasVoteTimeExpired = useHasVoteTimeExpired(governance, proposal);

    // const instructions = useInstructionsByProposal(proposal.pubkey);
    // const signatories = useSignatoriesByProposal(proposal.pubkey);

    const addressStr = useMemo(() => proposalAddress.toBase58(), [proposalAddress]);
    const shortAddress = useMemo(() => shortenAddress(proposalAddress.toString()), [proposalAddress])
    const { yes, no, abstain, total, yesPercent, yesAbstainPercent } = proposal.info.getVoteCounts();
    const { startDate, endDate, countdown } = useCountdown(proposal.info, governance.info);

    const {
      loading,
      failed,
      msg,
      content,
      isUrl: isDescriptionUrl
    } = useLoadGist(proposal.info.descriptionLink);

    return (<div className="view-container proposal flex column flex-start">
      {tokenOwnerRecord && <VoteModal
        vote={vote}
        visible={isVoteModalVisible}
        onClose={() => setIsVoteModalVisible(false)}
        governance={governance}
        proposal={proposal}
        tokenOwnerRecord={tokenOwnerRecord}
      />}
      <StakeRedirectModal
        visible={isStakeRedirectModalVisible}
        onClose={() => setIsStakeRedirectModalVisible(false)}
      />
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
                <p>{content}</p>
              )
            }

            <div className="neu-inset flex column">
              <div>
                <span>Proposal ID:</span>
                <span>{addressStr}</span>
              </div>
              <div>
                <span>{proposal.info.isVoting() ? "Voting time left:" : "Voting time:"} </span>
                <span>{countdown}</span>
              </div>
              <div>
                <span>Start date:</span>
                <span> {startDate ? startDate : "To be determined."}</span>
              </div>
              <div>
                <span>End date:</span>
                <span>{endDate ? endDate : "To be determined"}</span>
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
              <VoterList
                voteRecords={voterDisplayData}
                userVoteRecord={voteRecord?.tryUnwrap()?.info.getVoterDisplayData()} />
            </div>
          </div>
        </div>

        <div className="flex column" style={{ width: "30%" }} id="vote-desktop">
          <h2>Your Vote</h2>
          <div
            className="neu-container view-container flex column"
            id="your-vote"
          >
            <RelinquishVoteButton
              proposal={proposal}
              tokenOwnerRecord={tokenOwnerRecord}
              voteRecord={voteRecord?.tryUnwrap()}
              hasVoteTimeExpired={hasVoteTimeExpired}
            />
            <CastVoteButton
              governance={governance}
              proposal={proposal}
              tokenOwnerRecord={tokenOwnerRecord}
              vote={YesNoVote.Yes}
              voteRecord={voteRecord}
              hasVoteTimeExpired={hasVoteTimeExpired}
            />
            <CastVoteButton
              governance={governance}
              proposal={proposal}
              vote={YesNoVote.No}
              tokenOwnerRecord={tokenOwnerRecord}
              voteRecord={voteRecord}
              hasVoteTimeExpired={hasVoteTimeExpired}
            />
            <Button
              type="primary"
              disabled={(!connected || inactive) && true}
              onClick={handleVoteModal}
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
              // isStakeRedirectModalVisible={isStakeRedirectModalVisible}
              // setIsStakeRedirectModalVisible={setIsStakeRedirectModalVisible}
              // proposalNumber={id}
              // endDate={end}
            />
            {/* <PostMessageButton
            proposal={proposal}
            tokenOwnerRecord={tokenOwnerRecord}
          ></PostMessageButton> */}
          </div>
        </div>
      </div>

      <Divider />

      <div className="other-proposals">
        <h3>Other active proposals</h3>
        <div className="flex">
          {filteredProposals.filter(otherProp => !otherProp.pubkey.equals(proposal.pubkey)).map((proposal) => (
            <ProposalCard
              proposal={proposal}
              governance={governance}
              key={proposal.pubkey.toBase58()}
            />
          ))}
        </div>
      </div>
    </div>
    );
  }
};
