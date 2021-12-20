import { utils } from '@oyster/common';
import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { GOVERNANCE_CHAT_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { PostChatMessageArgs } from './instructions';
import { governanceChatProgramId, ChatMessageBody } from './accounts';

export async function withPostChatMessage(
  instructions: TransactionInstruction[],
  signers: Account[],
  governanceProgramId: PublicKey,
  governance: PublicKey,
  proposal: PublicKey,
  tokenOwnerRecord: PublicKey,
  governanceAuthority: PublicKey,
  payer: PublicKey,
  replyTo: PublicKey | undefined,
  body: ChatMessageBody,
) {
  const { system: systemId } = utils.programIds();

  const args = new PostChatMessageArgs({
    body,
  });

  const data = Buffer.from(serialize(GOVERNANCE_CHAT_SCHEMA, args));

  const chatMessage = new Account();
  signers.push(chatMessage);

  let keys = [
    {
      pubkey: governanceProgramId,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: governance,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: proposal,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: tokenOwnerRecord,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: governanceAuthority,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: chatMessage.publicKey,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: payer,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: systemId,
      isWritable: false,
      isSigner: false,
    },
  ];

  if (replyTo) {
    keys.push({
      pubkey: replyTo,
      isWritable: false,
      isSigner: false,
    });
  }

  instructions.push(
    new TransactionInstruction({
      keys,
      programId: governanceChatProgramId,
      data,
    }),
  );
}
