import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useProposal } from "../contexts/proposal";
import { ResultProgressBar } from "../components/ResultProgressBar";
import { Button, Divider, Modal } from "antd";
import { ProposalCard } from "../components/ProposalCard";
import { VoterList } from "../components/VoterList";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "../contexts/connection";

export const ProposalView = (props: any) => {

  const { id, headline, active, end, description, result, hash } = props;
  // TODO: Fetch user's stake from blockchain
  const { activeProposals } = useProposal();
  const { connected } = useWallet();

  const [stake, setStake] = useState(0);
  const inFavor = 722300;
  const against = 220700;
  const abstain = 70200;
  const startDate = new Date("Jan 5, 2022 15:37:25");
  const endDate = new Date("Jan 5, 2022 15:37:25");
  const now = new Date().getTime();
  const timeleft = end - now;
  const days = Math.floor(timeleft / (1000 * 60 * 60 * 24));


  const checkIsStaked = () => {
    if (stake === 0) {
      return false;
    }
  }

  const stakeRedirect = () => {
    Modal.error({
        title: 'Before you can vote, you need to lock some JET tokens.',
        centered: true,
        content: (
          <div>
            <p>Info about what this means. 1 JET = 1 vote. Lock funds in order to vote. Once you lock your desired amount of JET, you will be able to vote on active proposals. Your JET will remain bonded until the proposal voting period ends. Once the period has ended, you can unbond your JET. </p>
          </div>
      ),
      okText: `I understand`,
        onOk() {},
      });
  }
  
  const confirmFavor = () => {
    if (checkIsStaked()) {
      Modal.success({
        title: `You're about to vote in favor of proposal #${id}`,
        centered: true,
      content: (
        <div>
          <p>You have X.XX JET locked, and will be able to unlock these funds when voting ends on end.</p>
        </div>
      ),
      okText: `Confirm vote`,
      onOk() {},
    });
    } else {
      stakeRedirect();
    }
  }

  const confirmAgainst = () => {
    if (checkIsStaked()) {
      Modal.error({
        title: 'This is a notification message',
        centered: true,
        content: (
          <div>
            <p>some messages...some messages...</p>
            <p>some messages...some messages...</p>
          </div>
        ),
        onOk() { },
      });
    } else {
      stakeRedirect();
    }
  }
  const confirmAbstain = () => {
    if (checkIsStaked()) {
      Modal.info({
        title: 'This is a notification message',
        centered: true,
        content: (
          <div>
            <p>some messages...some messages...</p>
            <p>some messages...some messages...</p>
          </div>
        ),
        onOk() { },
      });
    } else {
      stakeRedirect();
    }
}

  return (
    <div className="content-body proposal flex column flex-start">
      <Link to="/">
        <i className="fas fa-arrow-left"></i> All Proposals
      </Link>

      <div className="flex content">
        <div className="flex column" style={{ width: "70%" }}>
          <h3>Proposal Details</h3>
          <div className="description neu-container">
            <div className="flex">
              <h3>Proposal {id}</h3>
            </div>
            <h1 className="headline text-gradient">{headline}</h1>
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
          <div className="neu-container flex column">
            <Button onClick={confirmFavor} disabled={!connected && true}>In favor</Button>
            <Button onClick={confirmAgainst} disabled={!connected && true}>Against</Button>
            <Button onClick={confirmAbstain} disabled={!connected && true}>Abstain</Button>
            <Button type="primary" disabled={!connected && true}>Vote</Button>
          </div>
        </div>

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
              <h5>Top stakeholders</h5>
              <VoterList/>
              
              {/* {TOP_STAKEHOLDERS.map((address) => (
                <Stakeholders
                  address={address.address}
                  amount={address.amount}
                  type={address.vote}
                />
              ))} */}
            </div>
          </div>
        </div>

        <div className="flex column" style={{ width: "30%" }} id="vote-desktop">
          <h3>Your Vote</h3>
          <div className="neu-container flex column" id="your-vote">
            <Button onClick={confirmFavor}>In favor</Button>
            <Button onClick={confirmAgainst}>Against</Button>
            <Button onClick={confirmAbstain}>Abstain</Button>
            <Button type="primary">Vote</Button>
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
