import { PublicKey } from '@solana/web3.js';

export function getRealmUrl(
  realm: PublicKey | string,
  programId: PublicKey | string,
) {
  return getItemUrl('realm', realm, programId);
}

export function getProposalUrl(
  proposal: PublicKey | string,
  programId: PublicKey | string,
  title?: string,
) {
  return getItemUrl('proposal', proposal, programId, title)
}

export function getOysterProposalUrl(
  proposal: PublicKey | string,
  programId: PublicKey | string,
) {
  return getItemUrl('proposal-oyster', proposal, programId);
}

export function getGovernanceUrl(
  governance: PublicKey | string,
  programId: PublicKey | string,
) {
  return getItemUrl('governance', governance, programId);
}

export function getHomeUrl(programId: PublicKey) {
  return `/?programId=${programId.toBase58()}`;
}

export function getItemUrl(
  itemName: string,
  itemId: PublicKey | string,
  programId: PublicKey | string,
  title?: string,
) {
  return `/${itemName}/${itemId instanceof PublicKey ? itemId.toBase58() : itemId
    }${title ? `/${title}` : ""}?programId=${programId instanceof PublicKey ? programId.toBase58() : programId
    }`;
}