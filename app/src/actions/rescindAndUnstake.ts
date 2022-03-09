import { AssociatedToken, StakeAccount, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { BN, Program } from "@project-serum/anchor";
import {
  Governance,
  ProgramAccount,
  TokenOwnerRecord,
  withDepositGoverningTokens,
  withRelinquishVote,
  withWithdrawGoverningTokens
} from "@solana/spl-governance";
import { Keypair, TransactionInstruction } from "@solana/web3.js";
import { RpcContext } from "@solana/spl-governance";
import { sendTransactionWithNotifications } from "../tools/transactions";
import { GOVERNANCE_PROGRAM_ID } from "../utils";
import { withApprove } from "../models/withApprove";
import {
  getParsedProposalsByGovernance,
  getUnrelinquishedVoteRecords
} from "../hooks/accountHooks";

export const rescindAndUnstake = async (
  { programId, programVersion, wallet, walletPubkey, connection }: RpcContext,
  stakeProgram: Program,
  stakePool: StakePool,
  stakeAccount: StakeAccount,
  governance: ProgramAccount<Governance>,
  tokenOwnerRecord: ProgramAccount<TokenOwnerRecord>,
  amount: BN
) => {
  const voteMint = stakePool.addresses.stakeVoteMint;
  const unbondingSeed = UnbondingAccount.randomSeed();
  let signers: Keypair[] = [];
  const ix: TransactionInstruction[] = [];
  const remainingStake = tokenOwnerRecord.account.governingTokenDepositAmount.sub(amount);

  // Get unrescinded proposals and relinquish votes before unstaking
  const proposals = await getParsedProposalsByGovernance(connection, programId, governance);

  // FIXME: Handle error if there are unfinalised proposals
  if (tokenOwnerRecord.account.unrelinquishedVotesCount > 0) {
    console.log("All Proposals Must Be Finalised To Withdraw Governing Tokens");
    console.log(
      "unrelinquishedVotesCount",
      tokenOwnerRecord.account.unrelinquishedVotesCount,
      "outstandingProposalCount",
      tokenOwnerRecord.account.outstandingProposalCount
    );

    const voteRecords = await getUnrelinquishedVoteRecords(
      connection,
      programId,
      tokenOwnerRecord!.account!.governingTokenOwner
    );

    for (const voteRecord of Object.values(voteRecords)) {
      let proposal = proposals[voteRecord.account.proposal.toString()];
      console.log("Relinquishing proposal", proposal.pubkey.toString(), proposal);

      if (!proposal) {
        continue;
      }

      // Note: We might hit single transaction limits here (accounts and size)
      // if user has too many unrelinquished votes
      withRelinquishVote(
        ix,
        programId,
        proposal.account.governance,
        proposal.pubkey,
        tokenOwnerRecord!.pubkey,
        proposal.account.governingTokenMint,
        voteRecord.pubkey,
        tokenOwnerRecord!.account.governingTokenOwner,
        walletPubkey
      );
    }
  }

  // Create vote token account
  const voterTokenAccount = await AssociatedToken.withCreate(
    ix,
    stakeProgram.provider,
    walletPubkey,
    voteMint
  );
  // Unstake Votes
  await withWithdrawGoverningTokens(
    ix,
    GOVERNANCE_PROGRAM_ID,
    governance.account.realm,
    voterTokenAccount,
    voteMint,
    walletPubkey
  );
  const transferAuthority = withApprove(ix, [], voterTokenAccount, walletPubkey, amount);
  signers.push(transferAuthority);

  // FIXME: This bit returns an error because you are trying to
  // redeposit more vote tokens into the governance program
  // than are in the vote token account

  // Restake Remaining Votes
  await withDepositGoverningTokens(
    ix,
    GOVERNANCE_PROGRAM_ID,
    programVersion,
    governance.account.realm,
    voterTokenAccount,
    voteMint,
    walletPubkey,
    transferAuthority.publicKey,
    walletPubkey,
    remainingStake
  );
  // Burn votes
  await StakeAccount.withBurnVotes(
    ix,
    stakePool,
    stakeAccount,
    walletPubkey,
    voterTokenAccount,
    amount
  );
  // Unstake Jet
  await UnbondingAccount.withUnbondStake(
    ix,
    stakePool,
    stakeAccount,
    wallet.publicKey!,
    unbondingSeed,
    amount
  );
  // Close vote token account
  await AssociatedToken.withClose(ix, walletPubkey, voteMint, walletPubkey);

  return await sendTransactionWithNotifications(
    connection,
    wallet,
    ix,
    signers,
    "Unstaking tokens",
    "Tokens have begun unbonding"
  );
};
