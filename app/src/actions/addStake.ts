import { AssociatedToken, JetMint, StakeAccount, StakePool } from "@jet-lab/jet-engine";
import { BN, Provider } from "@project-serum/anchor";
import { ProgramAccount, Realm, RpcContext } from "@solana/spl-governance";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { sendTransactionWithNotifications } from "../tools/transactions";
import { fromLamports } from "../utils";

export const addStake = async (
  { connection, wallet }: RpcContext,
  stakePool: StakePool,
  realm: ProgramAccount<Realm>,
  owner: PublicKey,
  amount: BN,
  jetMint: JetMint | undefined
) => {
  let instructions: TransactionInstruction[] = [];
  let signers: Keypair[] = [];

  const provider = new Provider(connection, wallet as any, Provider.defaultOptions());
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
  await StakeAccount.withMintVotes(instructions, stakePool, realm, owner, voterTokenAccount);

  await AssociatedToken.withClose(instructions, owner, voteMint, owner);

  const notificationTitle = `${fromLamports(amount, jetMint)} JET staked`;

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    notificationTitle
  );
};
