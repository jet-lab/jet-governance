import { Account, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

import { Proposal, VoteRecord } from '../models/accounts';
import { withCastVote } from '../models/withCastVote';
import { Vote, YesNoVote } from '../models/instructions';
import { RpcContext } from '../models/core/api';
import { ParsedAccount } from '../contexts';
import { useWallet } from "@solana/wallet-adapter-react";
import { withRelinquishVote } from '../models/withRelinquishVote';
import { Provider } from '@project-serum/anchor';
import { sendAllTransactionsWithNotifications } from '../tools/transactions';

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

  await sendAllTransactionsWithNotifications(
    connection,
    wallet,
    allTxs,
    'Voting on proposal',
    'Proposal voted on',
  );
};
