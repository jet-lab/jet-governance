import { WalletMultiButton } from "@solana/wallet-adapter-ant-design";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { TokenIcon } from "../../components/TokenIcon";
import { useConnectionConfig } from "../../contexts/connection";
import { useMarkets } from "../../contexts/market";
import { useUserBalance, useUserTotalBalance } from "../../hooks";
import { WRAPPED_SOL_MINT, JET_TOKEN_MINT } from "../../utils/ids";
import { ProposalCard } from "../../components/ProposalCard";
import { formatUSD } from "../../utils/utils";

export const HomeView = (props: any) => {
  const { marketEmitter, midPriceInUSD } = useMarkets();
  const { tokenMap } = useConnectionConfig();
  const SRM_ADDRESS = "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt";
  const SRM = useUserBalance(SRM_ADDRESS);
  const SOL = useUserBalance(WRAPPED_SOL_MINT);
  const JET = useUserBalance(JET_TOKEN_MINT);
  const { balanceInUSD: totalBalanceInUSD } = useUserTotalBalance();

  const { proposals } = props;

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

  return (
    <div className="main-content">
      <div className="stake-inset">Your Stake</div>

      <div>
        <h3>Proposals</h3>
        <div className="show-proposals">
          {proposals.map((proposal: any) => (
            <ProposalCard
              headline={proposal.headline}
              number={proposal.id}
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
