import { PublicKey } from "@solana/web3.js";
import React, { useState, useEffect } from "react";
import { abbreviateNumber, shortenAddress } from "../../utils/utils";

export const Stakeholders = (props: {
  type: string,
  amount: number,
  address: string,
  thisUser?: boolean
}) => {
  const { type, amount, address, thisUser } = props;
  const [color, setColor] = useState("hsla(0, 1%, 62%, 1)")
  const [vote, setVote] = useState("abstain")
  const [gradient, setGradient] = useState(false);
  const [symbol, setSymbol] = useState("");

  useEffect(() => {
    if (type === "inFavor") {
    setVote("in favor")
    setColor("var(--gradient)")
    setGradient(true);
    setSymbol("fas fa-thumbs-up")
  } else if (type === "against") {
    setVote("against")
    setColor("var(--failure)")
    setSymbol("fas fa-thumbs-down")
  }
  }, [type])

  return (
    <div className={`stakeholders ${thisUser && 'your-vote'}`} >
      <span className="address">{shortenAddress(address)}</span>
      <span className="amount">{abbreviateNumber(amount, 2)} JET</span>
      <span style={{color: color}} className={`vote ${gradient ? "text-gradient" : ""}`}>{vote} <i className={symbol}></i></span>
    </div>
  );
};
