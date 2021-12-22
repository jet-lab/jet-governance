import React, { useState, useEffect } from "react";
import { shortenAddress, abbreviateNumber } from "../../utils";

export const Row = (props: any) => {
  const { type, amount, address } = props;
  const [color, setColor] = useState("hsla(0, 1%, 62%, 1)")
  const [vote, setVote] = useState("abstain")
  const [gradient, setGradient] = useState(false);
  const [symbol, setSymbol] = useState("");

  useEffect(() => {
    if (type === true) {
    setVote("in favor")
    setColor("var(--gradient)")
    setGradient(true);
    setSymbol("fas fa-thumbs-up")
  } else if (type === false) {
    setVote("against")
    setColor("var(--failure)")
    setSymbol("fas fa-thumbs-down")
  }
  }, [type])

  return (
    <div className="stakeholders">
      <span className="address">{shortenAddress(address)}</span>
      <span className="amount">{abbreviateNumber(amount, 2)} JET</span>
      <span style={{color: color}} className={`vote ${gradient ? "text-gradient" : ""}`}>{vote} <i className={symbol}></i></span>
    </div>
  );
};
