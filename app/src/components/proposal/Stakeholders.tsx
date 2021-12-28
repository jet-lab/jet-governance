import React, { useState, useEffect } from "react";
import { shortenAddress, abbreviateNumber } from "../../utils";

export const Stakeholders = (props: {
  type: string,
  amount: number,
  address: string,
  thisUser?: boolean
}) => {
  const { type, amount, address, thisUser } = props;
  const [vote, setVote] = useState("undecided")

  useEffect(() => {
    if (type === "inFavor") {
    setVote("in favor")
  } else if (type === "against") {
    setVote("against")
  }
  }, [type])

  return (
    <div className={`stakeholders ${thisUser ? 'your-vote' : ""}`} >
      <span className="voter">{thisUser && 'Your Vote'}</span>
      <span className="address">{shortenAddress(address)}</span>
      <span className="amount">{abbreviateNumber(amount, 2)} JET</span>
      <span className="vote">{vote}</span>
    </div>
  );
};
