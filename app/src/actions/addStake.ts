import { Account, PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { approve } from "../models";
import { RpcContext } from "../models/core/api";
import { withDepositGoverningTokens } from "../models/withDepositGoverningTokens";
import { sendTransactionWithNotifications } from "../tools/transactions";
import { AssociatedToken, StakeAccount, StakePool } from "@jet-lab/jet-engine"

export const addStake = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: PublicKey,
  stakePool: StakePool,
  owner: PublicKey,
  amount: BN
) => {
  let instructions: TransactionInstruction[] = [];
  let signers: Account[] = [];

  const provider = stakePool.program.provider;
  const voteMint = stakePool.addresses.stakeVoteMint.address;
  const tokenMint = stakePool.stakePool.tokenMint
  const tokenAccount = AssociatedToken.derive(tokenMint, owner);

  const voterTokenAccount = await AssociatedToken.withCreate(instructions, provider, owner, voteMint)
  await StakeAccount.withCreate(instructions, stakePool.program, stakePool.addresses.stakePool.address, owner);
  await StakeAccount.withAddStake(instructions, stakePool, owner, tokenAccount, amount)
  await StakeAccount.withMintVotes(instructions, stakePool, owner, voterTokenAccount, amount)

  const transferAuthority = approve(
    instructions,
    [],
    voterTokenAccount,
    walletPubkey,
    amount,
  );

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
    amount,
  );

  await AssociatedToken.withClose(instructions, owner, voteMint, owner)

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Staking governing tokens',
    'Tokens have been staked',
  );
};