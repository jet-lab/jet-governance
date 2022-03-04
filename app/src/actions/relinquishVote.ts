import { Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";

import { Proposal } from "@solana/spl-governance";
import { RpcContext } from "@solana/spl-governance";
import { ProgramAccount } from "@solana/spl-governance";
import { withRelinquishVote } from "@solana/spl-governance";
import { sendTransactionWithNotifications } from "../tools/transactions";

export const relinquishVote = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  proposal: ProgramAccount<Proposal>,
  tokenOwnerRecord: PublicKey,
  voteRecord: PublicKey,
  isWithdrawal: boolean
) => {
  const signers: Keypair[] = [];
  const instructions: TransactionInstruction[] = [];

  const governanceAuthority = walletPubkey;
  const beneficiary = walletPubkey;

  withRelinquishVote(
    instructions,
    programId,
    proposal.account.governance,
    proposal.pubkey,
    tokenOwnerRecord,
    proposal.account.governingTokenMint,
    voteRecord,
    governanceAuthority,
    beneficiary
  );

  const transaction = new Transaction();
  transaction.add(...instructions);

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    isWithdrawal ? "Withdrawing vote from proposal" : "Releasing voting tokens",
    isWithdrawal ? "Vote withdrawn" : "Tokens released"
  );
};
