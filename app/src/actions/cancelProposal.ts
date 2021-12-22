import { Account, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '../models/accounts';

import { withCancelProposal } from '../models/withCancelProposal';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';
import { ParsedAccount } from '../contexts';

export const cancelProposal = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  proposal: ParsedAccount<Proposal>,
) => {
  let governanceAuthority = walletPubkey;

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  withCancelProposal(
    instructions,
    programId,
    programVersion,
    proposal.pubkey,
    proposal.info.tokenOwnerRecord,
    governanceAuthority,
    proposal.info.governance,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Cancelling proposal',
    'Proposal cancelled',
  );
};
