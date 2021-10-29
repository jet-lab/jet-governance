import { WalletMultiButton } from "@solana/wallet-adapter-ant-design";
import { Statistic, Col, Row } from "antd";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TokenIcon } from "../components/TokenIcon";
import { useConnectionConfig } from "../contexts/connection";
import { useMarkets } from "../contexts/market";
import { useUserBalance, useUserTotalBalance } from "../hooks";
import { WRAPPED_SOL_MINT } from "../utils/ids";
import { formatUSD } from "../utils/utils";
import { ResultProgressBar } from "../components/ResultProgressBar";

export const ProposalView = (props: any) => {
  const { marketEmitter, midPriceInUSD } = useMarkets();
  const { tokenMap } = useConnectionConfig();
  const SRM_ADDRESS = "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt";
  const SRM = useUserBalance(SRM_ADDRESS);
  const SOL = useUserBalance(WRAPPED_SOL_MINT);
  const { balanceInUSD: totalBalanceInUSD } = useUserTotalBalance();

  const { id, headline, active, end, result } = props;
  const [approve, setApprove] = useState(null)
  const [abstainProposal, setAbstainProposal] = useState(false);
  const [stake, setStake] = useState(32344)
  const inFavor = 73;
  const against = 22;
  const abstain = 5;
  const topStakeholders = [{
    address: "0x4dtest",
    amount: 17200000,
    vote: true
  }]

  const now = new Date().getTime();
  const timeleft = end - now;
  const days = Math.floor(timeleft / (1000 * 60 * 60 * 24));

  return (
    <div className="main-content proposal">
      <span>
        <i className="fas fa-arrow-left"></i> All Proposals
      </span>

      <div className="info">
        <div className="description">
          <div className="flex">
            <h3>Proposal {id}</h3>
            <div className="details">
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
            aliquam faucibus purus in massa. Ac auctor augue mauris augue neque
            gravida. Aenean euismod elementum nisi quis eleifend quam. Augue
            lacus viverra vitae congue. Diam sollicitudin tempor id eu nisl
            nunc.
          </p>
          <p>
            Ornare arcu odio ut sem nulla pharetra diam sit amet. Nisl vel
            pretium lectus quam id. Amet porttitor eget dolor morbi non arcu
            risus quis. Amet aliquam id diam maecenas ultricies mi eget mauris
            pharetra. Vitae semper quis lectus nulla at volutpat diam. Nunc sed
            augue lacus viverra ve eu. Neque convallis a cras semper auctor
            neque vitae tempus. Elementum integer enim neque volutpat ac. Ornare
            quam viverra orci.
          </p>
          <div className="divider"></div>
          <div className="details">

          </div>
        </div>

        <div className="cast-vote">
          <h3>Cast Your Vote</h3>
          <div style={{ textAlign: "center" }}>
            <div className="flex">
              <span className={!abstainProposal ? approve ? "active" : "button-gradient" : "abstain"} id="in-favour">
                <div className="text-gradient button-text">In favor <i className="fas fa-thumbs-up"></i></div>
              </span>
              <span className={!abstainProposal ? approve ? "button-gradient" : "active" : "abstain"} id="against">
                <div className="text-gradient button-text">Against <i className="fas fa-thumbs-down"></i></div>
              </span>
            </div>
            <div className="no-vote">Abstain From Voting</div>
          </div>

          <div className="divider" />
        
          <h3>Vote summary</h3>
          <h5>Your stake</h5>
          <div className="stake text-gradient">
            {stake} JET
          </div>
          <h5>Current results</h5>
          <div className="results">
            <ResultProgressBar type="inFavor" amount={inFavor} total={inFavor+against+abstain} />
            <ResultProgressBar type="against" amount={against} total={inFavor+against+abstain} />
            <ResultProgressBar type="abstain" amount={inFavor} total={inFavor+against+abstain} />
          </div>
          <h5>Top stakeholders</h5>
          <div className="stakeholders">
            {stake} JET
          </div>
        </div>
        
      </div>
    </div>
  );
};
