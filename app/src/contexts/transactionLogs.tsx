import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { RewardsClient, StakeClient } from "@jet-lab/jet-engine";
import { ConfirmedSignatureInfo, TransactionResponse } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { dateFromUnixTimestamp, JET_TOKEN_MINT, shortenAddress } from "../utils";
import { useRpcContext } from "../hooks";
import { BN } from "@project-serum/anchor";

// Transaction logs context
export interface TransactionLog {
  log: TransactionResponse;
  blockDate: string;
  signature: string;
  action: string;
  amount: string;
}
interface TransactionLogs {
  loadingLogs: boolean;
  logs: TransactionLog[];
  noMoreSignatures: boolean;
  searchMoreLogs: () => void;
}
const TransactionsContext = createContext<TransactionLogs>({
  loadingLogs: false,
  logs: [],
  noMoreSignatures: false,
  searchMoreLogs: () => {}
});

// Transaction logs context provider
export function TransactionsProvider(props: { children: any }) {
  const { connection } = useRpcContext();
  const { publicKey } = useWallet();
  const [signatures, setSignatures] = useState<ConfirmedSignatureInfo[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [noMoreSignatures, setNoMoreSignatures] = useState(false);
  const programIds = useMemo(
    () => [StakeClient.PROGRAM_ID.toString(), RewardsClient.PROGRAM_ID.toString()],
    []
  );

  // Returns the correct action type string
  // For staking from airdrop or wallet
  const getActionType = (action: string, wallet: string): string => {
    let actionType;
    switch (action) {
      case "stake":
        actionType = `Staked from wallet ${shortenAddress(wallet, 4)}`;
        break;
      case "unbond_stake":
        actionType = "Unstaked";
        break;
      case "withdraw_unbonded":
        actionType = "Withdrawn";
        break;
      case "cancel_unbond":
        actionType = "Unbonding canceled";
        break;
      case "claim":
        actionType = "Staked from Care Package";
        break;
      default:
        actionType = "Staked";
    }
    return actionType;
  };

  // Get transaction details from a signature
  const getLogDetail = (log: TransactionResponse, signature: string) => {
    if (!log.meta?.logMessages || !log.blockTime) {
      return;
    }

    // Record of instructions to their first 8 bytes for transaction logs
    const instructionBytes: Record<string, string> = {
      // Stake program
      stake: "[58,135,189,105,160,120,165,224]",
      unbond_stake: "[205,137,113,189,236,71,83,169]",
      withdraw_unbonded: "[237,172,52,157,194,124,79,168]",
      cancel_unbond: "[31, 195, 15, 13, 60, 233, 214, 208]",

      // Airdrop program
      claim: "[193,51,206,17,20,120,124,24]"
    };

    // Convert log accounts to strings
    const logAccounts: string[] = [];
    for (let account of log.transaction.message.accountKeys) {
      logAccounts.push(account.toString());
    }

    // Search for our program Id's in transaction's accounts
    for (let program of programIds) {
      if (logAccounts.includes(program) && log.meta.err === null) {
        // Get first 8 bytes from instruction data, stringify for comparison
        for (let inst of log.transaction.message.instructions) {
          // Get first 8 bytes from data
          const txInstBytes = [];
          for (let i = 0; i < 8; i++) {
            txInstBytes.push(bs58.decode(inst.data)[i]);
          }
          for (let progInst in instructionBytes) {
            // If those bytes match any of our instructions label trade action
            if (instructionBytes[progInst] === JSON.stringify(txInstBytes)) {
              // Determine amount if JET
              // Ensure that no log is created if token balance is undefined
              for (let pre of log.meta.preTokenBalances!) {
                for (let post of log.meta.postTokenBalances!) {
                  if (
                    pre.mint === post.mint &&
                    pre.uiTokenAmount.amount !== post.uiTokenAmount.amount &&
                    pre.mint === JET_TOKEN_MINT.toString()
                  ) {
                    const detailedLog: TransactionLog = {
                      log,
                      blockDate: dateFromUnixTimestamp(new BN(log.blockTime)),
                      signature,
                      action: getActionType(progInst, pre.owner!),
                      amount: `${Math.abs(
                        pre.uiTokenAmount.uiAmount! - post.uiTokenAmount.uiAmount!
                      ).toFixed(2)}`
                    };

                    // If we found mint match, add tx to logs
                    if (detailedLog.action !== undefined) {
                      return detailedLog;
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        return;
      }
    }
  };

  // Get transaction details for multiple signatures
  const getDetailedLogs = useCallback(async (sigs: ConfirmedSignatureInfo[]) => {
    // Begin loading transaction logs
    setLoadingLogs(true);

    // Iterate through signatures to get detailed logs
    let index = logs.length ? logs.length + 1 : 0;
    let newLogs: TransactionLog[] = [];
    while (newLogs.length < 10) {
      // Get current signature from index
      const currentSignature = sigs[index]?.signature;
      if (!currentSignature) {
        return;
      }

      // Get confirmed transaction for signature
      const log = await connection.getTransaction(currentSignature, { commitment: "confirmed" });
      const detailedLog = log ? getLogDetail(log, currentSignature) : null;
      if (detailedLog) {
        newLogs.push(detailedLog);
      }

      // Increment current index
      index++;

      // If we run out of signatures, break
      if (index >= sigs.length) {
        setNoMoreSignatures(true);
        break;
      }
    }

    // Add transaction logs and stop loading
    setLogs([...logs, ...newLogs]);
    setLoadingLogs(false);
  }, []);

  // Once we have a pubkey for user's wallet, init their logs
  // Call reset on any new pubkey or rpc node change
  useEffect(() => {
    setLogs([]);
    if (publicKey) {
      connection.getSignaturesForAddress(publicKey, undefined, "confirmed").then(signatures => {
        setSignatures(signatures);
        getDetailedLogs(signatures);
      });
    }
    return () => setLogs([]);
  }, [publicKey, connection, getDetailedLogs]);

  return (
    <TransactionsContext.Provider
      value={{
        loadingLogs,
        logs,
        noMoreSignatures,
        searchMoreLogs: () => getDetailedLogs(signatures)
      }}
    >
      {props.children}
    </TransactionsContext.Provider>
  );
}

// Transaction logs hook
export const useTransactionLogs = () => {
  const context = useContext(TransactionsContext);
  return context;
};
