import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Proposal, VoteRecord } from '../models/accounts';
import { withCastVote } from '../models/withCastVote';
import { Vote, YesNoVote } from '../models/instructions';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';
import { ParsedAccount } from '../contexts';
import { withRelinquishVote } from '../models/withRelinquishVote';

export const castVote = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: PublicKey,
  proposal: ParsedAccount<Proposal>,
  tokenOwnerRecord: PublicKey,
  yesNoVote: YesNoVote,
  voteRecord?: ParsedAccount<VoteRecord> | undefined,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  let governanceAuthority = walletPubkey;
  let payer = walletPubkey;

  if (voteRecord) {
    // FIXME! Relinquish before casting new vote failing.
    await withRelinquishVote(
      instructions,
      programId,
      proposal.info.governance,
      proposal.pubkey,
      tokenOwnerRecord,
      proposal.info.governingTokenMint,
      voteRecord!.pubkey,
      governanceAuthority,
      payer
    );
}
  
  await withCastVote(
    instructions,
    programId,
    programVersion,
    realm,
    proposal.info.governance,
    proposal.pubkey,
    proposal.info.tokenOwnerRecord,
    tokenOwnerRecord,
    governanceAuthority,
    proposal.info.governingTokenMint,
    Vote.fromYesNoVote(yesNoVote),
    payer,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Voting on proposal',
    'Proposal voted on',
  );
};
