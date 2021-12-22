import { InstructionData } from '../models/accounts';
import { RpcContext } from '../models/core/api';
import { Transaction } from '@solana/web3.js';
import { simulateTransaction } from "../contexts"

export async function dryRunInstruction(
  { connection, wallet }: RpcContext,
  instructionData: InstructionData,
) {
  let transaction = new Transaction({ feePayer: wallet!.publicKey });
  transaction.add({
    keys: instructionData.accounts,
    programId: instructionData.programId,
    data: Buffer.from(instructionData.data),
  });

  const result = await simulateTransaction(
    connection,
    transaction,
    'singleGossip',
  );

  return { response: result.value, transaction };
}
