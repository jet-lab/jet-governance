import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useProposal } from "../contexts/proposal";
import { ResultProgressBar } from "../components/proposal/ResultProgressBar";
import { Button, Divider, Modal } from "antd";
import { ProposalCard } from "../components/ProposalCard";
import { VoterList } from "../components/proposal/VoterList";
import { useWallet } from "@solana/wallet-adapter-react";
import { VoteModal } from "../components/proposal/VoteModal";
import { useUser } from "../hooks/useClient";

export const ProposalView = (props: any) => {

  const { id, headline, active, end, description, result, hash } = props;
  const [vote, setVote] = useState("");
  const [staked, setStaked] = useState(false);
    // TODO: Fetch user's stake from blockchain
  const { activeProposals } = useProposal();
  const { connected } = useWallet();
  const { locked } = useUser();

  const inFavor = 722300;
  const against = 220700;
  const abstain = 70200;
  const startDate = new Date("Jan 5, 2022 15:37:25");
  const endDate = new Date("Jan 5, 2022 15:37:25");

  useEffect(() => {
    if (locked !== 0) {
      return setStaked(true);
    };
  }, [])

  return (
    <div className="content-body proposal flex column flex-start">
      <Link to="/">
        <i className="fas fa-arrow-left"></i> All Proposals
      </Link>

      <div className="flex content">
        <div className="flex column" style={{ width: "70%" }}>
          <h3>Proposal Details</h3>
          <div className="description neu-container view-container">
            <div className="flex">
              <h3>Proposal {id}</h3>
            </div>
            <h1 className="headline text-gradient view-header">{headline}</h1>
            <p>
              {description}
            </p>

            <div className="neu-inset flex column">
              <div>
                <h5>Proposal ID:</h5>
                <span>{hash}</span>
              </div>
              <div>
                <h5>Start date:</h5>
                <span>{startDate.toString()}</span>
              </div>
              <div>
                <h5>End date:</h5>
                <span>{endDate.toString()}</span>
              </div>
              <div>
                <h5>Block height:</h5>
                <span>test</span>
              </div>
            </div>
          </div>

          <div className="flex column" id="vote-mobile">
          <h3>Your Vote</h3>
          <div className="neu-container flex column view-container">
            <Button onClick={()=>setVote("inFavor")} disabled={!connected && true}>In favor</Button>
            <Button onClick={()=>setVote("against")} disabled={!connected && true}>Against</Button>
            <Button onClick={()=>setVote("abstain")} disabled={!connected && true}>Abstain</Button>
            <Button type="primary" disabled={!connected && true}>Vote</Button>
            <VoteModal vote={vote} staked={staked} />
          </div>
        </div>

          <h3>Vote turnout</h3>
          <div className="neu-container flex justify-evenly view-container" id="vote-turnout">
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
              <h5>Top stakeholders</h5>
              <VoterList/>
            </div>
          </div>
        </div>

        <div className="flex column" style={{ width: "30%" }} id="vote-desktop">
          <h3>Your Vote</h3>
          <div className="neu-container view-container flex column" id="your-vote">
            <Button onClick={()=>setVote("inFavor")}  disabled={!connected && true}>In favor</Button>
            <Button onClick={()=>setVote("against")}  disabled={!connected && true}>Against</Button>
            <Button onClick={()=>setVote("abstain")}  disabled={!connected && true}>Abstain</Button>
            <VoteModal vote={vote} staked={staked} />
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
