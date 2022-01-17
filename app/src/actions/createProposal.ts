import { PublicKey, TransactionInstruction } from '@solana/web3.js';

import { withCreateProposal } from '../models/withCreateProposal';
import { withAddSignatory } from '../models/withAddSignatory';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';
import { VoteType } from '../models/accounts';
import { JET_TOKEN_MINT, OYSTER_GOV_PROGRAM_ID } from "../utils/ids";

export const createProposal = async (
  { connection, wallet, programVersion, walletPubkey }: RpcContext,
  realm: PublicKey,
  governance: PublicKey,
  tokenOwnerRecord: PublicKey,
  name: string,
  descriptionLink: string,
  proposalIndex: number,
): Promise<PublicKey> => {
  let instructions: TransactionInstruction[] = [];

  let governanceAuthority = walletPubkey;
  let signatory = walletPubkey;
  let payer = walletPubkey;

  // V2 Approve/Deny configuration
  const voteType = VoteType.SINGLE_CHOICE;
  const options = ['Approve'];
  const useDenyOption = true;

  const proposalAddress = await withCreateProposal(
    instructions,
    OYSTER_GOV_PROGRAM_ID,
    programVersion,
    realm,
    governance,
    tokenOwnerRecord,
    name,
    descriptionLink,
    JET_TOKEN_MINT,

    governanceAuthority,
    proposalIndex,
    voteType,
    options,
    useDenyOption,
    payer,
  );

  // Add the proposal creator as the default signatory
  await withAddSignatory(
    instructions,
    OYSTER_GOV_PROGRAM_ID,
    proposalAddress,
    tokenOwnerRecord,
    governanceAuthority,
    signatory,
    payer,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    [],
    'Creating proposal',
    'Proposal has been created',
  );

  return proposalAddress;
};
