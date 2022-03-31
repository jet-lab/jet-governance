import { PublicKey } from "@solana/web3.js";
import { useState, useEffect, useMemo } from "react";
import { useBlockExplorer, useProposalContext } from "../../contexts";
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
  const { getAccountExplorerUrl } = useBlockExplorer();
  const [vote, setVote] = useState("undecided");
  const address = useMemo(() => shortenAddress(user), [user]);
  const accountExplorerUrl = useMemo(() => getAccountExplorerUrl(user.toBase58()), [user]);
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
      <span className="address">
        <a target="_blank" rel="noreferrer" href={accountExplorerUrl}>
          {address}
        </a>
      </span>
      <span className="amount">{abbreviateNumber(fromLamports(amount, jetMint), 2)} JET</span>
      <span className="vote">{vote}</span>
    </div>
  );
};
