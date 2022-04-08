import { StakeAccount, StakeIdl, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { BN, Program, Provider } from "@project-serum/anchor";
import {
  getTokenOwnerRecordAddress,
  getTokenOwnerRecordForRealm,
  Governance,
  ProgramAccount,
  RpcContext,
  TokenOwnerRecord,
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
  try {
    tokenOwnerRecord = await getTokenOwnerRecordForRealm(
      connection,
      GOVERNANCE_PROGRAM_ID,
      stakePool.stakePool.governanceRealm,
      stakePool.stakePool.tokenMint,
      walletPubkey
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
  } else if (tokenOwnerRecord.account.unrelinquishedVotesCount > 0) {
    const voteRecords = await getUnrelinquishedVoteRecords(
      connection,
      programId,
      tokenOwnerRecord.account.governingTokenOwner
    );
    for (const voteRecord of Object.values(voteRecords)) {
      let proposal = proposals[voteRecord.account.proposal.toString()];
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
        voteRecord.pubkey,
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
  if (tokenOwnerRecord && !unstakeAll) {
    const voteRecords = await getUnrelinquishedVoteRecords(
      connection,
      programId,
      tokenOwnerRecord.account.governingTokenOwner
    );
    for (const voteRecord of Object.values(voteRecords)) {
      let proposal = proposals[voteRecord.account.proposal.toString()];
      if (!proposal || proposal.account.hasVoteTimeEnded(governance.account)) {
        continue;
      }
      if (voteRecord.account.vote) {
        const recastIxs: TransactionInstruction[] = [];
        await StakeAccount.withCreate(
          recastIxs,
          stakeProgram,
          stakePool.addresses.stakePool,
          walletPubkey,
          walletPubkey
        );
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
          voteRecord.account.vote,
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
