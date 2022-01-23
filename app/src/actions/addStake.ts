import { Account, PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { approve } from "../models";
import { RpcContext } from "../models/core/api";
import { withDepositGoverningTokens } from "../models/withDepositGoverningTokens";
import { sendTransactionWithNotifications } from "../tools/transactions";
import { JET_TOKEN_MINT } from "../utils";
import { AssociatedToken, JET_STAKE_ID, StakeAccount, StakeClient, StakePool } from "@jet-lab/jet-engine"
import { Console } from "console";

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
  const collateralMint = stakePool.addresses.stakeCollateralMint.address
  const collateralTokenAccount = await AssociatedToken.getAssociatedTokenAddress(collateralMint, owner);

  const accts = await StakePool.deriveAccounts(JET_STAKE_ID, StakePool.CANONICAL_SEED);
  const voterTokenAccount = await AssociatedToken.withCreate(instructions, provider, owner, voteMint)
  await StakeAccount.withCreate(instructions, stakePool.program, stakePool.addresses.stakePool.address, owner);
  await StakeAccount.withAddStake(instructions, stakePool, owner, collateralTokenAccount.address, amount)
  await StakeAccount.withMintVotes(instructions, stakePool, owner, voterTokenAccount.address, amount)

  const transferAuthority = approve(
    instructions,
    [],
    voterTokenAccount.address,
    walletPubkey,
    amount,
  );

  signers.push(transferAuthority);

  await withDepositGoverningTokens(
    instructions,
    programId,
    programVersion,
    realm,
    voterTokenAccount.address,
    JET_TOKEN_MINT,
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
    'Depositing governing tokens',
    'Tokens have been deposited',
  );
};