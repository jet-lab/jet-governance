import { ProgramAccount, Proposal, RpcContext, withRelinquishVote } from "@solana/spl-governance";
import { Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { sendTransaction } from "../tools/transactions";

export const relinquishVote = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  proposal: ProgramAccount<Proposal>,
  tokenOwnerRecord: PublicKey,
  voteRecord: PublicKey
): Promise<string> => {
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

  return await sendTransaction(connection, wallet, instructions, signers);
};
