import { createContext, useContext, useEffect, useState } from "react";
import { StakeClient } from "@jet-lab/jet-engine";
import { ConfirmedSignatureInfo, PublicKey, TransactionResponse } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { JET_TOKEN_MINT } from "../utils";
import { useRpcContext } from "../hooks";

// Transaction logs context
export interface TransactionLog {
  log: TransactionResponse;
  blockDate: string;
  signature: string;
  action: string;
  amount?: number;
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
  const { connected, publicKey } = useWallet();
  const [signatures, setSignatures] = useState<ConfirmedSignatureInfo[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [noMoreSignatures, setNoMoreSignatures] = useState(false);
  const programIds = [StakeClient.PROGRAM_ID.toString()];

  // Get transaction details from a signature
  async function getLogDetail(log: TransactionResponse, signature: string) {
    if (!(log.meta?.logMessages && log.blockTime)) {
      return;
    }

    // Record of instructions to their first 8 bytes for transaction logs
    const instructionBytes: Record<string, string> = {
      // Stake program
      stake: "[58,135,189,105,160,120,165,224]",
      unStake: "[205,137,113,189,236,71,83,169]",
      withdraw: "[237,172,52,157,194,124,79,168]"
    };

    // Convert log accounts to strings
    const logAccounts: string[] = [];
    for (let account of log.transaction.message.accountKeys) {
      logAccounts.push(account.toString());
    }

    // Search for our program Id's in transaction's accounts
    for (let program of programIds) {
      if (logAccounts.includes(program)) {
        console.log("Found relevant transaction");
        // Get first 8 bytes from instruction data, stringify for comparison
        let txInstBytes: any = [];
        for (let inst of log.transaction.message.instructions) {
          for (let i = 0; i < 8; i++) {
            txInstBytes.push(bs58.decode(inst.data)[i]);
          }
        }
        txInstBytes = JSON.stringify(txInstBytes);
        console.log(txInstBytes);

        // If those bytes match any of our instructions, label trade action
        for (let progInst in instructionBytes) {
          if (instructionBytes[progInst] === txInstBytes) {
            console.log("Found Matching Instruction");
            const detailedLog: TransactionLog = {
              log,
              blockDate: new Date(log.blockTime * 1000).toDateString(),
              signature,
              action: progInst
            };

            // Determine amount of JET (if applicable)
            for (let pre of log.meta.preTokenBalances!) {
              for (let post of log.meta.postTokenBalances!) {
                if (
                  pre.mint === post.mint &&
                  pre.uiTokenAmount.amount !== post.uiTokenAmount.amount
                ) {
                  if (pre.mint === JET_TOKEN_MINT.toString()) {
                    detailedLog.amount = post.uiTokenAmount.uiAmount! - pre.uiTokenAmount.uiAmount!;
                  }
                }
              }
            }

            // If we found instruction match, return the log and to logs array
            if (detailedLog.action) {
              return detailedLog;
            }
          }
        }
      } else {
        return;
      }
    }
  }

  // Get transaction details for multiple signatures
  async function getDetailedLogs(sigs: ConfirmedSignatureInfo[]) {
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
      console.log("Checking signature " + currentSignature);
      const log = await connection.getTransaction(currentSignature, { commitment: "confirmed" });
      const detailedLog = log ? await getLogDetail(log, currentSignature) : null;
      if (detailedLog) {
        console.log("found");
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
    console.log([...logs, ...newLogs]);
  }

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
  }, [connected, publicKey]);

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
