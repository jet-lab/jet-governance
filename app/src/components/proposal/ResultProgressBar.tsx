import { useState, useMemo } from "react";
import { Progress } from "antd";
import { abbreviateNumber, fromLamports, sharesToTokens } from "../../utils";
import { useProposalContext } from "../../contexts/proposal";
import { bnToNumber } from "@jet-lab/jet-engine";

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
