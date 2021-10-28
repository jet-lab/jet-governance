import { WalletMultiButton } from "@solana/wallet-adapter-ant-design";
import { Statistic, Col, Row } from "antd";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { TokenIcon } from "../../components/TokenIcon";
import { useConnectionConfig } from "../../contexts/connection";
import { useMarkets } from "../../contexts/market";
import { useUserBalance, useUserTotalBalance } from "../../hooks";
import { WRAPPED_SOL_MINT } from "../../utils/ids";
import { formatUSD } from "../../utils/utils";

export const ProposalView = (props: any) => {
  const { marketEmitter, midPriceInUSD } = useMarkets();
  const { tokenMap } = useConnectionConfig();
  const SRM_ADDRESS = "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt";
  const SRM = useUserBalance(SRM_ADDRESS);
  const SOL = useUserBalance(WRAPPED_SOL_MINT);
  const { balanceInUSD: totalBalanceInUSD } = useUserTotalBalance();

  const { id, headline, active, end } = props;

  useEffect(() => {
    const refreshTotal = () => {};

    const dispose = marketEmitter.onMarket(() => {
      refreshTotal();
    });

    refreshTotal();

    return () => {
      dispose();
    };
  }, [marketEmitter, midPriceInUSD, tokenMap]);

  const { Countdown } = Statistic;
  const deadline = Date.now() + 1000 * 60 * 60 * 24 * 2 + 1000 * 30; // Moment is also OK
  
  function onFinish() {
    console.log('finished!');
  }
  
  function onChange(val: number) {
    if (4.95 * 1000 < val && val < 5 * 1000) {
      console.log('changed!');
    }
  }

  return (
    <div className="main-content proposal">
      <span><i className="fas fa-arrow-left"></i> All Proposals</span>

      <div>
        <div className="description"></div>
        <div className="details"></div>
      </div>
    </div>
    // <Row gutter={[16, 16]} align="middle">
    //   <Col span={24}>
    //     <h2>Your Deposited Tokens ({formatUSD.format(totalBalanceInUSD)}):</h2>
    //     <h2>
    //       JET: {SOL.balance} ({formatUSD.format(SOL.balanceInUSD)})
    //     </h2>
    //     <h2 style={{ display: "inline-flex", alignItems: "center" }}>
    //       <TokenIcon mintAddress={SRM_ADDRESS} /> SRM: {SRM?.balance} (
    //       {formatUSD.format(SRM?.balanceInUSD)})
    //     </h2>
    //   </Col>

    //   <Col span={8}>
    //     <Countdown title="Countdown" value={deadline} onFinish={onFinish} />
    //   </Col>
    // </Row>
    
  );
};
