import {
  getGovernanceProgramVersion,
  ProgramAccount,
} from '@solana/spl-governance'
import { RpcContext } from '@solana/spl-governance'
import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import { Proposal } from '@solana/spl-governance'
import { withFinalizeVote } from '@solana/spl-governance'
import { sendTransactionWithNotifications } from '../tools/transactions'

export const finalizeVote = async (
  { connection, wallet, programId }: RpcContext,
  realm: PublicKey,
  proposal: ProgramAccount<Proposal>
) => {
  const signers: Keypair[] = []
  const instructions: TransactionInstruction[] = []

  // Explicitly request the version before making RPC calls to work around race conditions in resolving
  // the version for RealmInfo
  const programVersion = await getGovernanceProgramVersion(
    connection,
    programId
  )

  await withFinalizeVote(
    instructions,
    programId,
    programVersion,
    realm,
    proposal.account.governance,
    proposal.pubkey,
    proposal.account.tokenOwnerRecord,
    proposal.account.governingTokenMint
  )

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Finalizing votes',
    'Votes finalized',
  )
}
