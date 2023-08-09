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

  // The sum of shares could be greater than 2^53, in which case BN will throw an error
  // because the number is unsafe. Given that we are only using this number for displaying
  // an abbreviated value, we don't need to show the exact value.
  // Thus we divide the number by some divisor to make it safe, then mul by the same divisor
  // when rendering.
  let divisor = 1;
  if (amount > 0x20000000000000) {
    divisor = 1_000_000;
    amount = amount / divisor;
  }
  const jetTokens = sharesToTokens(amount, stakePool).tokens;

  return (
    <span>
      <strong>
        {percent.toFixed(0)}% {vote.toUpperCase()}
      </strong>
      <span className="amount">{abbreviateNumber(fromLamports(jetTokens, jetMint) * divisor)} JET</span>
      <Progress size="small" percent={percent} showInfo={false} strokeColor={color} />
    </span>
  );
};
