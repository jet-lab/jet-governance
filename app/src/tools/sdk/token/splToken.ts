import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID } from '../../../utils';

/**
 * Get the address for the associated token account
 *
 * @param mint Token mint account
 * @param owner Owner of the new account
 * @return Public key of the associated token account
 */
export async function getAssociatedTokenAddress(
  mint: PublicKey,
  owner: PublicKey,
): Promise<PublicKey> {
  return (
    await PublicKey.findProgramAddress(
      [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    )
  )[0];
}
