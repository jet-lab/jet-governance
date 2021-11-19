import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useConnectionConfig } from "../contexts/connection";
import { useUserBalance, useUserTotalBalance } from "../hooks";
import { WRAPPED_SOL_MINT } from "../utils/ids";
import { formatUSD, numberFormatter } from "../utils/utils";
import { ResultProgressBar } from "../components/ResultProgressBar";
import { Stakeholders } from "../components/Stakeholders";
import { TOP_STAKEHOLDERS } from "../models/TOP_STAKEHOLDERS";
import { Button, Divider, Modal } from "antd";
import { ProposalCard } from "../components/ProposalCard";

export const ProposalView = (props: any) => {
  const SRM_ADDRESS = "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt";
  const SRM = useUserBalance(SRM_ADDRESS);
  const SOL = useUserBalance(WRAPPED_SOL_MINT);
  const { balanceInUSD: totalBalanceInUSD } = useUserTotalBalance();

  const { id, headline, active, end, result, hash, shownProposals } = props;
  const [hasVoted, setHasVoted] = useState(false);
  const [approve, setApprove] = useState();
  const [abstainProposal, setAbstainProposal] = useState(false);
  // TODO: Fetch user's stake from blockchain
  const [stake, setStake] = useState(32344);
  const inFavor = 722300;
  const against = 220700;
  const abstain = 70200;
  const startDate = new Date("Jan 5, 2022 15:37:25");
  const endDate = new Date("Jan 5, 2022 15:37:25");
  const now = new Date().getTime();
  const timeleft = end - now;
  const days = Math.floor(timeleft / (1000 * 60 * 60 * 24));

  const confirmFavor = () => {
    Modal.success({
      title: `You're about to vote in favor of proposal #${id}`,
      content: (
        <div>
          <p>You have X.XX JET locked, and will be able to unlock these funds when voting ends on end.</p>
        </div>
      ),
      okText: `Confirm vote`,
      onOk() {},
    });
  }
  
  const confirmAgainst = () => {
    Modal.error({
      title: 'This is a notification message',
      content: (
        <div>
          <p>some messages...some messages...</p>
          <p>some messages...some messages...</p>
        </div>
      ),
      onOk() {},
    });
  }
  const confirmAbstain = () => {
    Modal.info({
      title: 'This is a notification message',
      content: (
        <div>
          <p>some messages...some messages...</p>
          <p>some messages...some messages...</p>
        </div>
      ),
      onOk() {},
    });
}

  return (
    <div className="content-body proposal flex column flex-start">
      <Link to="/">
        <i className="fas fa-arrow-left"></i> All Proposals
      </Link>

      <div className="flex info">
        <div className="flex column" style={{ width: "70%" }}>
          <h3>Proposal Details</h3>
          <div className="description">
            <div className="flex">
              <h3>Proposal {id}</h3>
              <div className="status-details">
                <div className={`status ${active ? "active" : result}`}>
                  <i className="fas fa-circle"></i>
                  {active ? "ACTIVE" : result}
                </div>
                {active ? <div className="end">{days} days left</div> : ""}
              </div>
            </div>
            <h1 className="headline text-gradient">{headline}</h1>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Mattis
              aliquam faucibus purus in massa. Ac auctor augue mauris augue
              neque gravida. Aenean euismod elementum nisi quis eleifend quam.
              Augue lacus viverra vitae congue. Diam sollicitudin tempor id eu
              nisl nunc.
            </p>
            <p>
              Ornare arcu odio ut sem nulla pharetra diam sit amet. Nisl vel
              pretium lectus quam id. Amet porttitor eget dolor morbi non arcu
              risus quis. Amet aliquam id diam maecenas ultricies mi eget mauris
              pharetra. Vitae semper quis lectus nulla at volutpat diam. Nunc
              sed augue lacus viverra ve eu. Neque convallis a cras semper
              auctor neque vitae tempus. Elementum integer enim neque volutpat
              ac. Ornare quam viverra orci.
            </p>

            <Divider />

            <div className="inset flex column">
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

          <h3>Vote turnout</h3>
          <div className="vote-turnout flex justify-evenly">
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
              {TOP_STAKEHOLDERS.map((address) => (
                <Stakeholders
                  address={address.address}
                  amount={address.amount}
                  type={address.vote}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex column" style={{ width: "30%" }}>
          <h3>Your Vote</h3>
          <div className="show-tokens flex column">
            <Button onClick={confirmFavor}>In favor</Button>
            <Button onClick={confirmAgainst}>Against</Button>
            <Button onClick={confirmAbstain}>Abstain</Button>
            <Button type="primary">Vote</Button>
          </div>
        </div>
      </div>

      <Divider />

      <div>
        <h3>Other active proposals</h3>
        <div className="flex">
        {shownProposals.map((proposal: any) => (
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
