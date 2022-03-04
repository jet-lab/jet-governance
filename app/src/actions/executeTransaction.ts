import { Keypair, TransactionInstruction } from "@solana/web3.js";

import { getGovernanceProgramVersion, Proposal, ProposalTransaction } from "@solana/spl-governance";

import { withExecuteTransaction } from "@solana/spl-governance";
import { RpcContext } from "@solana/spl-governance";
import { ProgramAccount } from "@solana/spl-governance";
import { sendTransactionWithNotifications } from "../tools/transactions";

export const executeTransaction = async (
  { connection, wallet, programId }: RpcContext,
  proposal: ProgramAccount<Proposal>,
  instruction: ProgramAccount<ProposalTransaction>
) => {
  const signers: Keypair[] = [];
  const instructions: TransactionInstruction[] = [];

  // Explicitly request the version before making RPC calls to work around race conditions in resolving
  // the version for RealmInfo
  const programVersion = await getGovernanceProgramVersion(connection, programId);

  await withExecuteTransaction(
    instructions,
    programId,
    programVersion,
    proposal.account.governance,
    proposal.pubkey,
    instruction.pubkey,
    [instruction.account.getSingleInstruction()]
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    "Executing instruction",
    "Execution finalized"
  );
};
