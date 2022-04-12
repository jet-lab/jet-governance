import {
  getGovernanceProgramVersion,
  ProgramAccount,
  Proposal,
  RpcContext,
  withFlagTransactionError
} from "@solana/spl-governance";
import { Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { sendTransaction } from "../tools/transactions";

export const flagInstructionError = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  proposal: ProgramAccount<Proposal>,
  proposalInstruction: PublicKey
): Promise<string> => {
  const governanceAuthority = walletPubkey;

  const signers: Keypair[] = [];
  const instructions: TransactionInstruction[] = [];

  // Explicitly request the version before making RPC calls to work around race conditions in resolving
  // the version for RealmInfo
  const programVersion = await getGovernanceProgramVersion(connection, programId);

  withFlagTransactionError(
    instructions,
    programId,
    programVersion,
    proposal.pubkey,
    proposal.account.tokenOwnerRecord,
    governanceAuthority,
    proposalInstruction
  );

  const transaction = new Transaction({ feePayer: walletPubkey });

  transaction.add(...instructions);

  return await sendTransaction(connection, wallet, instructions, signers);
};
