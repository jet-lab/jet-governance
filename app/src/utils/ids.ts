import { PublicKey } from '@solana/web3.js';

export const WRAPPED_SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
export let JET_TOKEN_MINT = new PublicKey('JET6zMJWkCN9tpRT2v2jfAmm5VnQFDpUBCyaKojmGtz');
export const JET_FAUCET_DEVNET = new PublicKey('4RqY4p1xXMcMF1xrGYtJG8aaQDR7s8GHkjfSHFqcBmQV');
export const COUNCIL_TOKEN_MINT = new PublicKey('GBZ2J49hpCLM8HDFav7gQ2zJNC3LCV264y42WhoqdEYo');
export const COUNCIL_FAUCET_DEVNET = new PublicKey('3AJLr1kbsC8btrizbYTWPCvfTfCJpK7JYHHpmZdy7sgM');
export let JET_REALM = new PublicKey('ASRAHYwEVhV3mGUarRvaE59ZUpKA8qKbNbLtipqT6J3G');
export let JET_GOVERNANCE = new PublicKey('8DWAqDJV53zP2qu7RtzcvU7dzncGe5TZom7p5ZtRbPZn');

export const GOVERNANCE_PROGRAM_ID = new PublicKey('GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw');

export let TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

export let SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
);
export let BPF_UPGRADE_LOADER_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
export let METADATA_PROGRAM_ID = new PublicKey('metaTA73sFPqA8whreUbBsbn3SLJH2vhrW9fP5dmfdC');

export const MEMO_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export const VAULT_ID = new PublicKey('94wRaYAQdC2gYF76AUTYSugNJ3rAC4EimjAMPwM7uYry');

export const AUCTION_ID = new PublicKey('C9nHkL6BfGx9M9MyYrJqAD5hPsGJd1fHpp1uAJA6vTCn');

export const METAPLEX_ID = new PublicKey('EPtpKdKW8qciGVd1UFyGjgbBHTbSAyvbY61h9uQGVgeu');

export const setProgramIds = (envName: string) => {
  if (envName === 'mainnet-beta') {
    JET_REALM = PublicKey.default; // FIXME!
    JET_GOVERNANCE = PublicKey.default; // FIXME!
    JET_TOKEN_MINT = new PublicKey('JET6zMJWkCN9tpRT2v2jfAmm5VnQFDpUBCyaKojmGtz');
  } else if (envName === 'devnet') {
    JET_REALM = new PublicKey('ASRAHYwEVhV3mGUarRvaE59ZUpKA8qKbNbLtipqT6J3G');
    JET_GOVERNANCE = new PublicKey('8DWAqDJV53zP2qu7RtzcvU7dzncGe5TZom7p5ZtRbPZn');
    JET_TOKEN_MINT = new PublicKey('FRuFWBrp1Kh6LpAi9CRvjk97C6YpCR7AERq62N2CZFUg');
  }
};

export const programIds = () => {
  return {
    associatedToken: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    bpf_upgrade_loader: BPF_UPGRADE_LOADER_ID,
    metadata: METADATA_PROGRAM_ID,
    memo: MEMO_ID,
    vault: VAULT_ID,
    auction: AUCTION_ID,
    metaplex: METAPLEX_ID
  };
};
