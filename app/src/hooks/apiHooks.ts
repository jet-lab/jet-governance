import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  getRealmConfigAddress,
  getSignatoryRecordAddress,
  getTokenOwnerRecordAddress,
  getVoteRecordAddress,
  Governance,
  Proposal,
  ProposalInstruction,
  RealmConfigAccount,
  SignatoryRecord,
  TokenOwnerRecord,
  VoteRecord,
} from '../models/accounts';
import { pubkeyFilter } from '../models/core/api';
import {
  useGovernanceAccountByPda,
  useGovernanceAccountByPubkey,
  useGovernanceAccountsByFilter,
} from './accountHooks';
import { useRpcContext } from './useRpcContext';
import { JET_GOVERNANCE, JET_REALM, JET_TOKEN_MINT } from '../utils';
import { useMemo } from 'react';
import BN from 'bn.js';

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
    [realm],
  )?.tryUnwrap();
}

// ----- Governance -----

export function useGovernance() {
  return useGovernanceAccountByPubkey<Governance>(
    Governance,
    JET_GOVERNANCE,
  )?.tryUnwrap();
}

export function useGovernancesByRealm(realm: PublicKey | undefined) {
  return useGovernanceAccountsByFilter<Governance>(Governance, [
    pubkeyFilter(1, realm),
  ]);
}

// ----- Proposal -----

export function useProposal(proposal: PublicKey | undefined) {
  return useGovernanceAccountByPubkey<Proposal>(
    Proposal,
    proposal,
  )?.tryUnwrap();
}

export function useProposalsByGovernance() {
  return useGovernanceAccountsByFilter<Proposal>(Proposal, [
    pubkeyFilter(1, JET_GOVERNANCE),
  ]);
}

// ----- TokenOwnerRecord -----

export function useTokenOwnerRecord(tokenOwnerRecord: PublicKey | undefined) {
  return useGovernanceAccountByPubkey<TokenOwnerRecord>(
    TokenOwnerRecord,
    tokenOwnerRecord,
  );
}

export function useTokenOwnerRecords() {
  return useGovernanceAccountsByFilter<TokenOwnerRecord>(TokenOwnerRecord, [
    pubkeyFilter(1, JET_REALM),
    pubkeyFilter(1 + 32, JET_TOKEN_MINT),
  ]);
}

export function useWalletTokenOwnerRecord(
  realm: PublicKey | undefined,
  governingTokenMint: PublicKey | undefined,
) {
  const { wallet, programId } = useRpcContext();

  return useGovernanceAccountByPda<TokenOwnerRecord>(
    TokenOwnerRecord,
    async () => {
      if (!realm || !wallet?.publicKey || !governingTokenMint) {
        return;
      }

      console.log("realmWallet", realm.toString())

      return await getTokenOwnerRecordAddress(
        programId,
        realm,
        governingTokenMint,
        wallet.publicKey,
      );
    },
    [wallet?.publicKey, governingTokenMint, realm],
  )?.tryUnwrap();
}

/// Returns all TokenOwnerRecords for the current wallet
export function useWalletTokenOwnerRecords() {
  const { publicKey } = useWallet();

  return useGovernanceAccountsByFilter<TokenOwnerRecord>(TokenOwnerRecord, [
    pubkeyFilter(1 + 32 + 32, publicKey),
  ]);
}

export function useProposalAuthority(proposalOwner: PublicKey | undefined) {
  const { publicKey, connected } = useWallet();
  const tokenOwnerRecord = useTokenOwnerRecord(proposalOwner);

  return connected &&
    tokenOwnerRecord?.isSome() &&
    (tokenOwnerRecord.value.info.governingTokenOwner.toBase58() ===
      publicKey?.toBase58() ||
      tokenOwnerRecord.value.info.governanceDelegate?.toBase58() ===
        publicKey?.toBase58())
    ? tokenOwnerRecord?.tryUnwrap()
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

      return await getSignatoryRecordAddress(
        programId,
        proposal,
        wallet.publicKey,
      );
    },
    [wallet?.publicKey, proposal],
  )?.tryUnwrap();
}

export function useSignatoriesByProposal(proposal: PublicKey | undefined) {
  return useGovernanceAccountsByFilter<SignatoryRecord>(SignatoryRecord, [
    pubkeyFilter(1, proposal),
  ]);
}

// ----- Proposal Instruction -----

export function useInstructionsByProposal(proposal: PublicKey | undefined) {
  return useGovernanceAccountsByFilter<ProposalInstruction>(
    ProposalInstruction,
    [pubkeyFilter(1, proposal)],
  );
}

// ----- VoteRecord -----

export const useVoteRecordsByProposal = (proposal: PublicKey | undefined) => {
  return useGovernanceAccountsByFilter<VoteRecord>(VoteRecord, [
    pubkeyFilter(1, proposal),
  ]);
};

export const useWalletVoteRecords = () => {
  const { wallet } = useRpcContext();
  return useGovernanceAccountsByFilter<VoteRecord>(VoteRecord, [
    pubkeyFilter(1 + 32, wallet.publicKey),
  ]);
};

export const useTokenOwnerVoteRecord = (
  proposal: PublicKey,
  tokenOwnerRecord: PublicKey | undefined,
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
    [tokenOwnerRecord, proposal],
  );
};

export function useBN(number: number | undefined, exponent: number | null | undefined = null) {
  return useMemo(() => {
    if (number === undefined) {
      return new BN(0)
    } else if (exponent === undefined) {
      return new BN(0)
    } else if (exponent === null) {
      return new BN(number.toLocaleString(undefined, {}))
    } else {
      return new BN(BigInt(number * 10 ** 9).toString())
    }
  }, [number, exponent])
}