import { StakeAccount, StakeIdl, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { BN, Program, Provider } from "@project-serum/anchor";
import {
  getTokenOwnerRecordAddress,
  getTokenOwnerRecordForRealm,
  Governance,
  ProgramAccount,
  RpcContext,
  TokenOwnerRecord,
  VoteRecord,
  withCastVote,
  withCreateTokenOwnerRecord,
  withRelinquishVote
} from "@solana/spl-governance";
import { Transaction, TransactionInstruction } from "@solana/web3.js";
import { getParsedProposalsByGovernance, getUnrelinquishedVoteRecords } from "../hooks";
import { sendAllTransactionsWithNotifications } from "../tools/transactions";
import { GOVERNANCE_PROGRAM_ID } from "../utils";
export const rescindAndUnstake = async (
  { programId, wallet, walletPubkey, connection, programVersion }: RpcContext,
  stakePool: StakePool,
  stakeAccount: StakeAccount,
  governance: ProgramAccount<Governance>,
  amount: BN,
  stakeProgram: Program<StakeIdl>,
  unstakeAll: boolean
) => {
  const unbondingSeed = UnbondingAccount.randomSeed();
  const allTxs = [];
  const provider = new Provider(connection, wallet as any, { skipPreflight: true });
  const proposals = await getParsedProposalsByGovernance(connection, programId, governance);
  // Load the token owner record
  const tokenOwnerRecordAddress = await getTokenOwnerRecordAddress(
    GOVERNANCE_PROGRAM_ID,
    stakePool.stakePool.governanceRealm,
    stakePool.stakePool.tokenMint,
    walletPubkey
  );
  let tokenOwnerRecord: ProgramAccount<TokenOwnerRecord> | undefined;
  let voteRecords: ProgramAccount<VoteRecord>[] | undefined;
  try {
    tokenOwnerRecord = await getTokenOwnerRecordForRealm(
      connection,
      GOVERNANCE_PROGRAM_ID,
      stakePool.stakePool.governanceRealm,
      stakePool.stakePool.tokenMint,
      walletPubkey
    );

    voteRecords = await getUnrelinquishedVoteRecords(
      connection,
      programId,
      tokenOwnerRecord.account.governingTokenOwner
    );
  } catch (err: any) {
    console.log(err);
  }
  if (!tokenOwnerRecord) {
    const ix: TransactionInstruction[] = [];
    // unbond_stake requires that the token owner record must exist,
    // so that it can verify that the owner is allowed to withdraw
    await withCreateTokenOwnerRecord(
      ix,
      GOVERNANCE_PROGRAM_ID,
      stakePool.stakePool.governanceRealm,
      walletPubkey,
      stakePool.stakePool.tokenMint,
      walletPubkey
    );
    allTxs.push({
      tx: new Transaction().add(...ix),
      signers: []
    });
  } else if (tokenOwnerRecord.account.unrelinquishedVotesCount > 0 && voteRecords) {
    for (const i in voteRecords) {
      let proposal = proposals[voteRecords[i].account.proposal.toString()];
      if (!proposal) {
        continue;
      }
      const relinquishIxs: TransactionInstruction[] = [];
      withRelinquishVote(
        relinquishIxs,
        programId,
        proposal.account.governance,
        proposal.pubkey,
        tokenOwnerRecord.pubkey,
        proposal.account.governingTokenMint,
        voteRecords[i].pubkey,
        tokenOwnerRecord.account.governingTokenOwner,
        walletPubkey
      );
      allTxs.push({
        tx: new Transaction().add(...relinquishIxs),
        signers: []
      });
    }
  }
  // Unstake Jet
  const unbondIxs: TransactionInstruction[] = [];
  await UnbondingAccount.withUnbondStake(
    unbondIxs,
    stakePool,
    stakeAccount,
    tokenOwnerRecordAddress,
    walletPubkey,
    unbondingSeed,
    amount
  );
  allTxs.push({
    tx: new Transaction().add(...unbondIxs),
    signers: []
  });

  // If there is still remaining JET and they have previously cast votes,
  // Re-cast those votes if proposals are still active
  if (voteRecords && tokenOwnerRecord && !unstakeAll) {
    for (const i in voteRecords) {
      let proposal = proposals[voteRecords[i].account.proposal.toString()];
      if (!proposal || proposal.account.hasVoteTimeEnded(governance.account)) {
        continue;
      }
      if (voteRecords[i].account.vote) {
        const recastIxs: TransactionInstruction[] = [];
        await withCastVote(
          recastIxs,
          programId,
          programVersion,
          stakePool.stakePool.governanceRealm,
          proposal.account.governance,
          proposal.pubkey,
          proposal.account.tokenOwnerRecord,
          tokenOwnerRecord.pubkey,
          walletPubkey,
          proposal.account.governingTokenMint,
          voteRecords[i].account.vote!,
          walletPubkey,
          stakeAccount.addresses.voterWeightRecord,
          stakePool.stakePool.maxVoterWeightRecord
        );
        allTxs.push({
          tx: new Transaction().add(...recastIxs),
          signers: []
        });
      }
    }
  }
  await sendAllTransactionsWithNotifications(provider, allTxs, "JET has begun unbonding");
};
