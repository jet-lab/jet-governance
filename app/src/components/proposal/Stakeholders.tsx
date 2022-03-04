import { PublicKey } from "@solana/web3.js";
import { useState, useEffect, useMemo } from "react";
import { useProposalContext } from "../../contexts/proposal";
import { shortenAddress, abbreviateNumber, fromLamports } from "../../utils";

export const Stakeholders = ({
  type,
  amount,
  user,
  thisUser
}: {
  type: string;
  amount: number;
  user: PublicKey;
  thisUser?: boolean;
}) => {
  const [vote, setVote] = useState("undecided");
  const address = useMemo(() => shortenAddress(user), [user]);
  const { jetMint } = useProposalContext();

  useEffect(() => {
    if (type === "Approve") {
      setVote("in favor");
    } else if (type === "Reject") {
      setVote("against");
    }
  }, [type]);

  return (
    <div className={`stakeholders ${thisUser ? "your-vote" : ""}`}>
      <span className="voter">{thisUser && "Your Vote"}</span>
      <span className="address">{address}</span>
      <span className="amount">{abbreviateNumber(fromLamports(amount, jetMint), 2)} JET</span>
      <span className="vote">{vote}</span>
    </div>
  );
};
