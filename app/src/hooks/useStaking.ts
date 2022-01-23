import { useEffect, useMemo, useState } from 'react'
import { useWallet } from "@solana/wallet-adapter-react";
import { BN, Program, Provider } from '@project-serum/anchor';
import { Auth, bnToNumber, StakeAccount, StakeClient, StakePool, UnbondingAccount, } from "@jet-lab/jet-engine";
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { useConnection } from '../contexts';
import { getAssociatedTokenAddress } from '../tools/sdk/token/splToken';
import { parseTokenAccount } from '@jet-lab/jet-engine/lib/common/accountParser';
import { AccountInfo as TokenAccount } from "@solana/spl-token"
import { UserAuthentication } from '@jet-lab/jet-engine/lib/auth/auth';

const confirmOptions: ConfirmOptions = {
  skipPreflight: false,
  commitment: 'recent',
  preflightCommitment: 'recent'
}

export function useConfirmOptions() {
  return confirmOptions
}

export function useWalletAddress() {
  const wallet = useWallet();
  return wallet.publicKey;
}

export function useProvider() {
  const connection = useConnection()
  const wallet = useWallet()
  const confirmOptions = useConfirmOptions()

  return useMemo(
    () => new Provider(connection, wallet as any, confirmOptions),
    [connection, wallet, confirmOptions]
  )
}

export function useStakeProgram() {
  const provider = useProvider()
  const [program, setProgram] = useState<Program | undefined>()

  useEffect(() => {
    let abort = false
    StakeClient.connect(provider)
      .then(newProgram => !abort && setProgram(newProgram))
      .catch(console.error)

    return () => { abort = true }
  }, [provider])

  return program
}

export function useStakePool(stakeProgram: Program | undefined) {
  const [pool, setPool] = useState<StakePool | undefined>()
  useEffect(() => {
    let abort = false
    if (stakeProgram) {
      StakePool.load(stakeProgram, StakePool.CANONICAL_SEED)
        .then(newPool => !abort && setPool(newPool))
        .catch(console.error)
    } else {
      setPool(undefined);
    }

    return () => { abort = true }
  }, [stakeProgram])

  return pool
}

export function useStakeAccount(stakeProgram: Program | undefined, stakePool: StakePool | undefined) {
  const { publicKey } = useWallet();
  const [stakeAccount, setStakeAccount] = useState<StakeAccount | undefined>()
  useEffect(() => {
    let abort = false

    if (stakeProgram && stakePool && publicKey) {
      StakeAccount.load(stakeProgram, stakePool.addresses.stakePool.address, publicKey)
        .then(newStakeAccount => !abort && setStakeAccount(newStakeAccount))
        .catch(() => !abort && setStakeAccount(undefined))
    } else {
      setStakeAccount(undefined);
    }

    return () => { abort = true }
  }, [stakeProgram, stakePool, publicKey])
  return stakeAccount
}

export function useUnbondingAccountsByStakeAccount(stakeProgram: Program | undefined, stakeAccount: StakeAccount | undefined) {
  const [unbondingAccounts, setUnbondingAccounts] = useState<UnbondingAccount[] | undefined>()
  useEffect(() => {
    let abort = false

    if (stakeProgram && stakeAccount) {
      UnbondingAccount.loadByStakeAccount(stakeProgram, stakeAccount.address)
        .then(newUnbondingAccounts => !abort && setUnbondingAccounts(newUnbondingAccounts))
        .catch(console.error)
    } else {
      setUnbondingAccounts(undefined)
    }

    return () => { abort = true }
  }, [stakeProgram, stakeAccount])
  return unbondingAccounts;
}

export interface StakedBalance {
  stakedJet: number,
  unstakedJet: number,
  unbondingJet: number,
  unlockedVotes: number,
}

export function useStakedBalance(stakeAccount: StakeAccount | undefined, stakePool: StakePool | undefined): StakedBalance {
  const unlockedVoteLamports = useAssociatedTokenBalance(stakePool?.addresses.stakeVoteMint.address);
  const unstakedJetLamports = useAssociatedTokenBalance(stakePool?.stakePool.tokenMint);

  const decimals = stakePool?.collateralMint.decimals
  const voteDecimals = stakePool?.voteMint.decimals

  const unlockedVotes = voteDecimals !== undefined ?
    bnToNumber(unlockedVoteLamports) / 10 ** voteDecimals :
    0

  const unstakedJet = decimals !== undefined ?
    bnToNumber(unstakedJetLamports) / 10 ** decimals :
    0

  const stakedJet = stakeAccount && decimals !== undefined ?
    bnToNumber(stakeAccount.stakeAccount.shares) / 10 ** decimals :
    0

  const unbondingJet = -1;

  return {
    stakedJet,
    unstakedJet,
    unbondingJet,
    unlockedVotes,
  }
}

export function useAuthProgram() {
  const provider = useProvider()
  const [program, setProgram] = useState<Program | undefined>()

  useEffect(() => {
    let abort = false
    Auth.connect(provider)
      .then(newProgram => !abort && setProgram(newProgram))
      .catch(console.error)

    return () => { abort = true }
  }, [provider])

  return program
}

/** Load the user auth accunt. The account will be fetched every 2 seconds until it has been authenticated. */
export function useAuthAccount(authProgram: Program | undefined) {
  const wallet = useWallet()
  const [authAccount, setAuthAccount] = useState<UserAuthentication | undefined>()
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false
    const interval = setInterval(() => {
      if (!wallet.publicKey || !authProgram) {
        setLoading(true)
        setAuthAccount(undefined);
        return;
      }
      if (authAccount && authAccount.complete) {
        console.log("Authization complete, allowed? ", authAccount.allowed)
        clearInterval(interval)
        return;
      }

      Auth.loadUserAuth(authProgram, wallet.publicKey)
        .then(newAccount => {
          if (!abort) {
            setLoading(false);
            setAuthAccount(newAccount)
          }
        })
        .catch(() => {
          setLoading(false)
          setAuthAccount(undefined)
        })
    }, 1000)

    return () => { abort = true; clearInterval(interval) }
  }, [wallet.publicKey, authProgram, authAccount])
  return { authAccount, loading };
}

export function useBN(number: number | undefined, exponent: number | null | undefined = null) {
  return useMemo(() => {
    if (number === undefined) {
      return new BN(0)
    }

    if (exponent === undefined) {
      return new BN(0)
    } else if (exponent === null) {
      return new BN(number.toLocaleString(undefined, {}))
    } else {
      return new BN(BigInt(number * 10 ** 9).toString())
    }
  }, [number, exponent])
}

export function useAssociatedTokenAddress(mint: PublicKey | undefined, owner: PublicKey | null | undefined = null) {
  const { publicKey } = useWallet();
  const [tokenAddress, setTokenAddress] = useState<PublicKey | undefined>()

  useEffect(() => {
    let abort = false;
    let owner2 = owner;
    if (owner2 === null) {
      owner2 = publicKey;
    }
    if (!owner2 || !mint) {
      setTokenAddress(undefined)
      return;
    }

    getAssociatedTokenAddress(mint, owner2)
      .then(newTokenAddress => !abort && setTokenAddress(newTokenAddress))

    return () => { abort = true }
  }, [mint, owner, publicKey])

  return tokenAddress;
}

export function useTokenAccount(tokenAddress: PublicKey | undefined) {
  const connection = useConnection();

  const [tokenAccount, setTokenAccount] = useState<TokenAccount | undefined>()

  useEffect(() => {
    let abort = false;

    if (!tokenAddress) {
      setTokenAccount(undefined);
      return;
    }

    connection.getAccountInfo(tokenAddress)
      .then(info => {
        if (abort) {
          return;
        }
        if (!info) {
          setTokenAccount(undefined)
          return;
        }
        const tokenAccount = parseTokenAccount(info?.data, tokenAddress)
        setTokenAccount(tokenAccount)
      })

    return () => { abort = true }
  }, [tokenAddress, connection])

  return tokenAccount;
}

export function useAssociatedTokenAccount(mint: PublicKey | undefined, owner: PublicKey | null | undefined = null) {
  const tokenAddress = useAssociatedTokenAddress(mint, owner)
  const tokenAccount = useTokenAccount(tokenAddress)
  return tokenAccount
}

export function useAssociatedTokenBalance(mint: PublicKey | undefined, owner: PublicKey | null | undefined = null) {
  const tokenAccount = useAssociatedTokenAccount(mint, owner)
  return useMemo(() => {
    return tokenAccount?.amount ?? new BN(0)
  }, [tokenAccount])
}