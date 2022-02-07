import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '../models/accounts';
import { withCastVote } from '../models/withCastVote';
import { Vote, YesNoVote } from '../models/instructions';
import { RpcContext } from '../models/core/api';
import { ParsedAccount } from '../contexts';
import { withRelinquishVote } from '../models/withRelinquishVote';
import { sendAllTransactionsWithNotifications } from '../tools/transactions';
import { Provider } from '@project-serum/anchor';

export const castVote = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: PublicKey,
  proposal: ParsedAccount<Proposal>,
  tokenOwnerRecord: PublicKey,
  yesNoVote: YesNoVote,
  voteRecord?: PublicKey
) => {
  let relinquishVoteIx: TransactionInstruction[] = [];
  // let signers: Account[] = [];
  let castVoteIx: TransactionInstruction[] = [];
  const allTxs = [];

  let governanceAuthority = walletPubkey;
  let payer = walletPubkey;

    // Withdraw existing vote before casting new vote
    // Then sign both transactions at once

  if (tokenOwnerRecord && voteRecord) {
  await withRelinquishVote(
    relinquishVoteIx,
    programId,
    proposal.info.governance,
    proposal.pubkey,
    tokenOwnerRecord,
    proposal.info.governingTokenMint,
    voteRecord,
    governanceAuthority,
    payer
    )
  
    const relinquishTx = new Transaction().add(...relinquishVoteIx)
    allTxs.push({
      tx: relinquishTx,
      signers: []
    })
  }

  await withCastVote(
    castVoteIx,
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

  const castTx = new Transaction().add(...castVoteIx)
  allTxs.push({
    tx: castTx,
    signers: []
  })

  const provider = new Provider(connection, wallet as any, Provider.defaultOptions())
  await sendAllTransactionsWithNotifications(
    provider,
    allTxs,
    'Voting on proposal',
    'Vote cast',
  );
};
