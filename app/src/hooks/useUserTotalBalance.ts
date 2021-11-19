import { useEffect, useState } from "react";
import { cache } from "../contexts/accounts";
import { fromLamports } from "../utils/utils";
import { useUserAccounts } from "./useUserAccounts";

export function useUserTotalBalance() {
  const { userAccounts } = useUserAccounts();
  const [balanceInUSD, setBalanceInUSD] = useState(0);

  return {
    balanceInUSD,
    accounts: userAccounts,
    hasBalance: userAccounts.length > 0 && balanceInUSD > 0,
  };
}
