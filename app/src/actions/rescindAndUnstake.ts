import { AssociatedToken, StakeAccount, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { BN, Program } from "@project-serum/anchor";
import { SendTxRequest } from "@project-serum/anchor/dist/cjs/provider";
import { Governance, ProgramAccount, TokenOwnerRecord, VoteRecord, withDepositGoverningTokens, withRelinquishVote, withWithdrawGoverningTokens } from "@solana/spl-governance";
import { Transaction, TransactionInstruction } from "@solana/web3.js";
import { RpcContext } from "@solana/spl-governance";
import { sendAllTransactionsWithNotifications } from "../tools/transactions";
import { GOVERNANCE_PROGRAM_ID } from "../utils";
import { withApprove } from "../models";

export const rescindAndUnstake = async (
  { programVersion, walletPubkey }: RpcContext,
  stakeProgram: Program,
  stakePool: StakePool,
  stakeAccount: StakeAccount,
  governance: ProgramAccount<Governance>,
  tokenOwnerRecord: ProgramAccount<TokenOwnerRecord>,
  walletVoteRecords: ProgramAccount<VoteRecord>[],
  amount: BN,
) => {

  const voteMint = stakePool.addresses.stakeVoteMint.address;
  const unbondingSeed = UnbondingAccount.randomSeed();
  const unrelinquished = walletVoteRecords.filter(voteRecord => !voteRecord.account.isRelinquished)
  const transactions: Transaction[] = [];
  const remainingStake = tokenOwnerRecord.account.governingTokenDepositAmount.sub(amount);

  // Rescind vote records
  for (let i = 0; i < unrelinquished.length; i++) {
    const voteRecord = unrelinquished[i];
    const ix: TransactionInstruction[] = [];
    const governanceAuthority = walletPubkey;
    const beneficiary = walletPubkey;

    await withRelinquishVote(
      ix,
      GOVERNANCE_PROGRAM_ID,
      governance.pubkey,
      voteRecord.account.proposal,
      tokenOwnerRecord.pubkey,
      voteMint,
      voteRecord.pubkey,
      governanceAuthority,
      beneficiary,
    )
    transactions.push(new Transaction().add(...ix))
  }

  const instructions: TransactionInstruction[] = []

  // Create vote token account
  const voterTokenAccount = await AssociatedToken.withCreate(instructions, stakeProgram.provider, walletPubkey, voteMint)
  // Unstake Votes
  await withWithdrawGoverningTokens(instructions, GOVERNANCE_PROGRAM_ID, governance.account.realm, voterTokenAccount, voteMint, walletPubkey);
  const transferAuthority = withApprove(
    instructions,
    [],
    voterTokenAccount,
    walletPubkey,
    amount,
  );
  // Restake Remaining Votes
  await withDepositGoverningTokens(instructions, GOVERNANCE_PROGRAM_ID, programVersion, governance.account.realm, voterTokenAccount, voteMint, walletPubkey, transferAuthority.publicKey, walletPubkey, remainingStake)
  // Burn votes
  await StakeAccount.withBurnVotes(instructions, stakePool, stakeAccount, walletPubkey, voterTokenAccount, amount)
  // Unstake Jet
  await UnbondingAccount.withUnbondStake(instructions, stakePool, stakeAccount, unbondingSeed, amount)
  // Close vote token account
  await AssociatedToken.withClose(instructions, walletPubkey, voteMint, walletPubkey)

  const reqs: SendTxRequest[] = [
    ...transactions.map(tx => {
      return {
        tx,
        signers: []
      }
    }),
    {
      tx: new Transaction().add(...instructions),
      signers: [transferAuthority]
    }
  ]

  // FIXME! Send all with notifications
  return await sendAllTransactionsWithNotifications(
    stakeProgram.provider,
    reqs,
    "Unstaking tokens",
    "Tokens have begun unbonding")
}