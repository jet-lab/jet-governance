import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '../models/accounts';

import { withFlagInstructionError } from '../models/withFlagInstructionError';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';
import { ParsedAccount } from '../contexts';

export const flagInstructionError = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  proposal: ParsedAccount<Proposal>,
  proposalInstruction: PublicKey,
) => {
  let governanceAuthority = walletPubkey;

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  withFlagInstructionError(
    instructions,
    programId,
    proposal.pubkey,
    proposal.info.tokenOwnerRecord,
    governanceAuthority,
    proposalInstruction,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Flagging instruction as broken',
    'Instruction flagged as broken',
  );
};
