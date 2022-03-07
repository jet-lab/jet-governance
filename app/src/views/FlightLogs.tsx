import { useWallet } from "@solana/wallet-adapter-react";
import { FooterLinks } from "../components/FooterLinks";
import { useProposalContext } from "../contexts/proposal";
import { UnbondingLog } from "../components/unbonding/UnbondingLog";
import { useTransactionLogs } from "../contexts/transactionLogs";
import { Divider } from "antd";
import { fromLamports } from "../utils";
import { Loader } from "../components/Loader";

export const FlightLogView = () => {
  const { unbondingAccounts, jetMint } = useProposalContext();
  const { loadingLogs, logs } = useTransactionLogs();
  const { connected } = useWallet();

  // Open explorer
  const explorerUrl = (txid: string) =>
    window.open(`https://explorer.solana.com/${txid}`, "_blank");

  return (
    <div className="view-container column-grid" id="flight-logs-view">
      <div className="neu-container centered" id="flight-log">
        <h1>Flight Logs</h1>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th className="center-text">Action</th>
              <th>Amount</th>
            </tr>
            <tr className="table-divider"></tr>
          </thead>

          {connected && (
            <tbody>
              {/* Incomplete unstaking actions only */}

              {unbondingAccounts?.map(row => (
                <UnbondingLog key={row.address.toBase58()} unbondingAccount={row} />
              ))}

              {unbondingAccounts && unbondingAccounts?.length > 0 && logs.length > 0 && (
                <td colSpan={4}>
                  <Divider />
                </td>
              )}
              {loadingLogs && (
                <tr>
                  <td colSpan={4}>
                    <Loader button />
                  </td>
                </tr>
              )}

              {/* Staking actions and completed unstaking actions */}
              {logs.map(row => (
                <tr>
                  <td>{row.blockDate}</td>
                  <td>Complete</td>
                  <td className="asset" onClick={() => explorerUrl(row.signature)}>
                    {row.action}
                  </td>
                  <td className="reserve-detail center-text">
                    {row.amount && row.amount > 0 ? "+" : ""} {row.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
      <div className="spacer" />
      <FooterLinks />
    </div>
  );
};
