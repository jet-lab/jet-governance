import React, { useState, useEffect } from "react";
import { Progress } from 'antd';
import { abbreviateNumber } from "../../utils/utils";

export const ResultProgressBar = (props: {
  type: string, amount: number, total: number
}) => {
  const { type, amount, total } = props;
  const [color, setColor] = useState("")
  const [vote, setVote] = useState("inFavor")
  const [gradient, setGradient] = useState(true);
  const [symbol, setSymbol] = useState("fas fa-thumbs-up");

  useEffect(() => {
    if (type === "against") {
      setVote("against")
      setColor("var(--failure)")
      setSymbol("fas fa-thumbs-down")
      setGradient(false)
    } else if (type === "abstain") {
    setVote("abstain")
    setColor("var(--grey)")
      setSymbol("")
      setGradient(false)
  }
}, [type])

  const percent = (amount / total) * 100

  return (
    <div style={{color: color}} className={`results-header ${gradient ? "text-gradient" : ""}`}>
      {percent.toFixed(0)}% {" "}
      {vote.toUpperCase()} <i className={symbol}></i>
      <span>{abbreviateNumber(amount, 1)} JET</span>
      <Progress size="small" percent={percent} showInfo={false} strokeColor={color} />
    </div>
  );
};
