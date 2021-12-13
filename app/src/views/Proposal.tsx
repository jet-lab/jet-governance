import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useProposal } from "../contexts/proposal";
import { ResultProgressBar } from "../components/proposal/ResultProgressBar";
import { Button, Divider, Tag } from "antd";
import { ProposalCard } from "../components/ProposalCard";
import { VoterList } from "../components/proposal/VoterList";
import { useWallet } from "@solana/wallet-adapter-react";
import { VoteModal } from "../components/proposal/VoteModal";
import { useUser } from "../hooks/useClient";
import { USER_VOTE_HISTORY } from "../models/USER_VOTE_HISTORY";
import { TOP_STAKEHOLDERS } from "../models/TOP_STAKEHOLDERS";
import { INITIAL_STATE } from "../models/INITIAL_PROPOSALS";

export const ProposalView = (props: { id: number }) => {
  const [inactive, setInactive] = useState(true);
  const [isVoteModalVisible, setIsVoteModalVisible] = useState(false);
  const [isStakeRedirectModalVisible, setIsStakeRedirectModalVisible] =
    useState(false);
  const [ifStaked, setIfStaked] = useState(false);
  const [vote, setVote] = useState("");

  // TODO: Fetch user's stake from blockchain
  const { activeProposals } = useProposal();
  const { connected } = useWallet();
  const { stakedBalance } = useUser();

  //TODO: Fix this temporary fix from the proposal being possibly undefined
  const proposal =
    INITIAL_STATE.find((proposal) => proposal.id === props.id) ??
    INITIAL_STATE[0];

  const {
    id,
    headline,
    start,
    end,
    description,
    result,
    hash,
    type,
    inFavor,
    against,
    abstain,
  } = proposal;

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
  const userVote = USER_VOTE_HISTORY.find((x) => x.id === id);

  const handleCsvDownload = () => {
    // Convert array of objects to array of arrays
    const voteHistoryCsv = TOP_STAKEHOLDERS.map(Object.values);

    //define the heading for each row of the data
    var csv = "Address,Amount,Vote\n";

    //merge the data with CSV
    voteHistoryCsv.forEach(function (row) {
      csv += row.join(",");
      csv += "\n";
    });

    var hiddenElement = document.createElement("a");
    hiddenElement.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
    hiddenElement.target = "_blank";

    //provide the name for the CSV file to be downloaded
    hiddenElement.download = `JetGovern_${id}_Votes.csv'`;
    hiddenElement.click();
  };

  return (
    <div className="view-container proposal flex column flex-start">
      <Link to="/">
        <i className="fas fa-arrow-left"></i> All Proposals
      </Link>

      <div className="view-container flex content">
        <div className="flex column" style={{ width: "70%" }}>
          <h3>Proposal Details</h3>
          <div className="description neu-container ">
            <div className="flex">
              <h3>Proposal {id}</h3>
            </div>
            <h1 className="text-gradient view-header">{headline}</h1>
            <p>{description}</p>

            <div className="neu-inset flex column">
              <div>
                <span>Proposal ID:</span>
                <span>{hash}</span>
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

          {/* <div className="flex column" id="vote-mobile">
          <h3>Your Vote</h3>
          <div className="neu-container flex column">
          <Button onClick={()=>setVote("inFavor")} disabled={(!connected || !inactive) && true}>In favor</Button>
            <Button onClick={()=>setVote("against")} disabled={(!connected || !inactive) && true}>Against</Button>
            <Button onClick={()=>setVote("abstain")} disabled={(!connected || !inactive) && true}>Abstain</Button>
              <Button
                type="primary"
                disabled={(!connected || !inactive) && true}
                onClick={handleVoteModal} 
              >Vote</Button>
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
        </div> */}

          <h3>Vote turnout</h3>
          <div className="neu-container flex justify-evenly" id="vote-turnout">
            <div className="results">
              <ResultProgressBar
                type="inFavor"
                amount={inFavor}
                total={inFavor + against + abstain}
              />
              <ResultProgressBar
                type="against"
                amount={against}
                total={inFavor + against + abstain}
              />
              <ResultProgressBar
                type="abstain"
                amount={abstain}
                total={inFavor + against + abstain}
              />
            </div>
            <div className="voters">
              <div className="flex justify-between">
                <span>Your vote</span>
                <span onClick={handleCsvDownload} id="csv">CSV</span>
              </div>
              <VoterList
                id={id}
                userVote={userVote?.vote}
                amount={userVote?.amount}
              />
            </div>
          </div>
        </div>

        <div className="flex column" style={{ width: "30%" }} id="vote-desktop">
          {userVote && (<h3>Your Vote</h3>)}
          <div
            className="neu-container view-container flex column"
            id="your-vote"
          >
            <Button
              onClick={() => setVote("inFavor")}
              disabled={(!connected || inactive) && true}
            >
              In favor
            </Button>
            <Button
              onClick={() => setVote("against")}
              disabled={(!connected || inactive) && true}
            >
              Against
            </Button>
            <Button
              onClick={() => setVote("abstain")}
              disabled={(!connected || inactive) && true}
            >
              Abstain
            </Button>
            <Button
              type="primary"
              disabled={(!connected || inactive) && true}
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
          {activeProposals.map((proposal: any) => (
            <ProposalCard
              headline={proposal.headline}
              number={proposal.id}
              id={proposal.id}
              active={proposal.active}
              end={proposal.end ?? null}
              result={proposal.result ?? null}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
