import { bnToNumber } from "@jet-lab/jet-engine";
import { Progress } from "antd";
import { useState, useMemo } from "react";
import { useProposalContext } from "../../contexts";
import { abbreviateNumber, fromLamports, sharesToTokens } from "../../utils";

export const ResultProgressBar = ({
  type,
  amount,
  total
}: {
  type: string;
  amount: number;
  total: number;
}) => {
  const [color, setColor] = useState("");
  const [vote, setVote] = useState("in favor");
  const { jetMint, stakePool } = useProposalContext();

  useMemo(() => {
    if (type === "Reject") {
      setVote("against");
      setColor("var(--failure)");
    } else if (type === "Abstain") {
      setVote("abstain");
      setColor("var(--grey)");
    }
  }, [type]);

  const percent = total === 0 ? 0 : (amount / total) * 100;
  const jetTokens = bnToNumber(sharesToTokens(amount, stakePool).tokens);

  return (
    <span>
      <strong>
        {percent.toFixed(0)}% {vote.toUpperCase()}
      </strong>
      <span className="amount">{abbreviateNumber(fromLamports(jetTokens, jetMint))} JET</span>
      <Progress size="small" percent={percent} showInfo={false} strokeColor={color} />
    </span>
  );
};
