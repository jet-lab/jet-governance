import { useUserAccounts } from "./useUserAccounts";

export function useUserTotalBalance() {
  const { userAccounts } = useUserAccounts();
  const balanceInUSD = 0;

  return {
    balanceInUSD,
    accounts: userAccounts,
    hasBalance: userAccounts.length > 0 && balanceInUSD > 0,
  };
}
