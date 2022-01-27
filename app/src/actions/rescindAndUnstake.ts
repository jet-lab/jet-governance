import { AssociatedToken, StakeAccount, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { BN, Program } from "@project-serum/anchor";
import { SendTxRequest } from "@project-serum/anchor/dist/cjs/provider";
import { Transaction, TransactionInstruction } from "@solana/web3.js";
import { ParsedAccount } from "../contexts";
import { Governance, TokenOwnerRecord, VoteRecord } from "../models/accounts";
import { withRelinquishVote } from "../models/withRelinquishVote";
import { withWithdrawGoverningTokens } from "../models/withWithdrawGoverningTokens";
import { GOVERNANCE_PROGRAM_ID } from "../utils";

export const rescindAndUnstake = async (
  stakeProgram: Program,
  stakePool: StakePool,
  stakeAccount: StakeAccount,
  governance: ParsedAccount<Governance>,
  tokenOwnerRecord: ParsedAccount<TokenOwnerRecord>,
  walletVoteRecords: ParsedAccount<VoteRecord>[],
  amount: BN,
) => {
  // Create vote token account
  // Rescind vote records
  // Withdraw Votes
  // Burn votes
  // Unstake
  // Close vote token account

  const wallet = stakeProgram.provider.wallet.publicKey;
  const voteMint = stakePool.addresses.stakeVoteMint.address;

  const unrelinquished = walletVoteRecords.filter(voteRecord => !voteRecord.info.isRelinquished)
  const relinquishTxs: Transaction[] = [];
  for (let i = 0; i < unrelinquished.length; i++) {
    const voteRecord = unrelinquished[i];
    const ix: TransactionInstruction[] = [];
    const governanceAuthority = wallet;
    const beneficiary = wallet;

    await withRelinquishVote(
      ix,
      GOVERNANCE_PROGRAM_ID,
      governance.pubkey,
      voteRecord.info.proposal,
      tokenOwnerRecord.pubkey,
      voteMint,
      voteRecord.pubkey,
      governanceAuthority,
      beneficiary,
    )
    relinquishTxs.push(new Transaction().add(...ix))
  }

  const instructions: TransactionInstruction[] = []

  const voteTokens = await AssociatedToken.withCreate(
    instructions,
    stakeProgram.provider,
    wallet,
    voteMint)

  await withWithdrawGoverningTokens(
    instructions,
    GOVERNANCE_PROGRAM_ID,
    governance.info.realm,
    voteTokens,
    voteMint,
    wallet);

  await StakeAccount.withBurnVotes(
    instructions,
    stakePool,
    stakeAccount,
    wallet,
    voteTokens,
    amount,
  )

  const unbondingSeed = UnbondingAccount.randomSeed()
  UnbondingAccount.withUnbondStake(
    instructions,
    stakePool,
    stakeAccount,
    unbondingSeed,
    amount
  )

  await AssociatedToken.withClose(
    instructions,
    wallet,
    voteMint,
    wallet)

  const reqs: SendTxRequest[] = [
    ...relinquishTxs.map(tx => {
      return {
        tx,
        signers: []
      }
    }),
    {
      tx: new Transaction().add(...instructions),
      signers: []
    }
  ]

  // FIXME! Send all with notifications
  return await stakeProgram.provider.sendAll(reqs);
}