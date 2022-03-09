import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { withApprove } from "../models/withApprove";
import { RpcContext, withDepositGoverningTokens } from "@solana/spl-governance";
import { sendTransactionWithNotifications } from "../tools/transactions";
import { AssociatedToken, StakeAccount, StakePool } from "@jet-lab/jet-engine";

export const addStake = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: PublicKey,
  stakePool: StakePool,
  owner: PublicKey,
  amount: BN
) => {
  let instructions: TransactionInstruction[] = [];
  let signers: Keypair[] = [];
  console.log(stakePool.program.provider.wallet.publicKey.toBase58());

  const provider = stakePool.program.provider;
  const voteMint = stakePool.addresses.stakeVoteMint;
  const tokenMint = stakePool.stakePool.tokenMint;
  const tokenAccount = AssociatedToken.derive(tokenMint, owner);

  const voterTokenAccount = await AssociatedToken.withCreate(
    instructions,
    provider,
    owner,
    voteMint
  );
  await StakeAccount.withCreate(
    instructions,
    stakePool.program,
    stakePool.addresses.stakePool,
    owner,
    owner
  );
  await StakeAccount.withAddStake(instructions, stakePool, owner, owner, tokenAccount, amount);
  await StakeAccount.withMintVotes(instructions, stakePool, owner, voterTokenAccount, amount);

  const transferAuthority = withApprove(instructions, [], voterTokenAccount, walletPubkey, amount);

  signers.push(transferAuthority);

  await withDepositGoverningTokens(
    instructions,
    programId,
    programVersion,
    realm,
    voterTokenAccount,
    voteMint,
    walletPubkey,
    transferAuthority.publicKey,
    walletPubkey,
    amount
  );

  await AssociatedToken.withClose(instructions, owner, voteMint, owner);

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    "Staking governing tokens",
    "Tokens have been staked"
  );
};
