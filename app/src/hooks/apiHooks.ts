import { Provider } from "@project-serum/anchor";
import {
  getRealmConfigAddress,
  getSignatoryRecordAddress,
  getTokenOwnerRecordAddress,
  getVoteRecordAddress,
  Governance,
  Proposal,
  pubkeyFilter,
  RealmConfigAccount,
  SignatoryRecord,
  TokenOwnerRecord,
  VoteRecord
} from "@solana/spl-governance";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import {
  useGovernanceAccountByPda,
  useGovernanceAccountByPubkey,
  useGovernanceAccounts
} from "./accountHooks";
import { useRpcContext } from "./useRpcContext";

// ----- Realm Config ---------

export function useRealmConfig(realm: PublicKey) {
  const { programId } = useRpcContext();

  return useGovernanceAccountByPda<RealmConfigAccount>(
    RealmConfigAccount,
    async () => {
      if (!realm) {
        return;
      }
      return await getRealmConfigAddress(programId, realm);
    },
    [realm]
  );
}

// ----- Governance -----

export function useGovernance(governance: PublicKey | undefined) {
  return useGovernanceAccountByPubkey<Governance>(Governance, governance);
}

export function useGovernancesByRealm(realm: PublicKey | undefined) {
  return useGovernanceAccounts<Governance>(Governance, [pubkeyFilter(1, realm)]);
}

// ----- Proposal -----

export function useProposal(proposal: PublicKey | undefined) {
  return useGovernanceAccountByPubkey<Proposal>(Proposal, proposal);
}

export function useProposalsByGovernance(governance: PublicKey | undefined) {
  return useGovernanceAccounts<Proposal>(Proposal, [pubkeyFilter(1, governance)]);
}

// ----- TokenOwnerRecord -----

export function useTokenOwnerRecord(tokenOwnerRecord: PublicKey | undefined) {
  return useGovernanceAccountByPubkey<TokenOwnerRecord>(TokenOwnerRecord, tokenOwnerRecord);
}

export function useTokenOwnerRecords(
  realm: PublicKey | undefined,
  governingTokenMint: PublicKey | undefined
) {
  return useGovernanceAccounts<TokenOwnerRecord>(TokenOwnerRecord, [
    pubkeyFilter(1, realm),
    pubkeyFilter(1 + 32, governingTokenMint)
  ]);
}

export function useWalletTokenOwnerRecord(
  realm: PublicKey | undefined,
  governingTokenMint: PublicKey | undefined
) {
  const { wallet, programId } = useRpcContext();

  return useGovernanceAccountByPda<TokenOwnerRecord>(
    TokenOwnerRecord,
    async () => {
      if (!realm || !wallet?.publicKey || !governingTokenMint) {
        return;
      }

      return await getTokenOwnerRecordAddress(
        programId,
        realm,
        governingTokenMint,
        wallet.publicKey
      );
    },
    [wallet?.publicKey, governingTokenMint, realm]
  );
}

/// Returns all TokenOwnerRecords for the current wallet
export function useWalletTokenOwnerRecords() {
  const { publicKey } = useWallet();

  return useGovernanceAccounts<TokenOwnerRecord>(TokenOwnerRecord, [
    pubkeyFilter(1 + 32 + 32, publicKey)
  ]);
}

export function useProposalAuthority(proposalOwner: PublicKey | undefined) {
  const { publicKey, connected } = useWallet();
  const tokenOwnerRecord = useTokenOwnerRecord(proposalOwner);

  return connected &&
    tokenOwnerRecord &&
    (tokenOwnerRecord.account.governingTokenOwner.toBase58() === publicKey?.toBase58() ||
      tokenOwnerRecord.account.governanceDelegate?.toBase58() === publicKey?.toBase58())
    ? tokenOwnerRecord
    : undefined;
}

// ----- Signatory Record -----

export function useWalletSignatoryRecord(proposal: PublicKey) {
  const { wallet, programId } = useRpcContext();

  return useGovernanceAccountByPda<SignatoryRecord>(
    SignatoryRecord,
    async () => {
      if (!proposal || !wallet?.publicKey) {
        return;
      }

      return await getSignatoryRecordAddress(programId, proposal, wallet.publicKey);
    },
    [wallet?.publicKey, proposal]
  );
}

export function useSignatoriesByProposal(proposal: PublicKey | undefined) {
  return useGovernanceAccounts<SignatoryRecord>(SignatoryRecord, [pubkeyFilter(1, proposal)]);
}

// ----- VoteRecord -----

export const useVoteRecordsByProposal = (proposal: PublicKey | undefined) => {
  return useGovernanceAccounts<VoteRecord>(VoteRecord, [pubkeyFilter(1, proposal)]);
};

export const useTokenOwnerVoteRecord = (
  proposal: PublicKey | undefined,
  tokenOwnerRecord: PublicKey | undefined
) => {
  const { programId } = useRpcContext();

  return useGovernanceAccountByPda<VoteRecord>(
    VoteRecord,
    async () => {
      if (!proposal || !tokenOwnerRecord) {
        return;
      }

      return await getVoteRecordAddress(programId, proposal, tokenOwnerRecord);
    },
    [tokenOwnerRecord, proposal]
  );
};

export function useProvider(connection: Connection | undefined, wallet: any) {
  return useMemo(() => {
    return new Provider(connection as Connection, wallet, { skipPreflight: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, wallet?.publicKey?.toBase58()]);
}
