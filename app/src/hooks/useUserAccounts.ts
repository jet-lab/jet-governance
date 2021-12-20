import { TokenAccount } from "../models";
import { useAccountsContext } from "@oyster/common";

export function useUserAccounts() {
  const context = useAccountsContext();
  return {
    userAccounts: context.userAccounts as TokenAccount[],
  };
}
