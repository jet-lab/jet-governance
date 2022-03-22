import { useWallet } from "@solana/wallet-adapter-react";
import { FooterLinks } from "../components/FooterLinks";
import { useProposalContext } from "../contexts/proposal";
import { UnbondingLog } from "../components/unbonding/UnbondingLog";
import { useTransactionLogs } from "../contexts/transactionLogs";
import { Button, Divider } from "antd";
import { Loader } from "../components/Loader";
import { openExplorer } from "../utils";

export const FlightLogView = () => {
  const { unbondingAccounts } = useProposalContext();
  const { loadingLogs, logs, searchMoreLogs } = useTransactionLogs();
  const { connected } = useWallet();

  return (
    <div className="view-container justify-start" id="flight-logs-view">
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
            <tr className="table-divider" />
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
                <tr onClick={() => openExplorer(row.signature)}>
                  <td>{row.blockDate}</td>
                  <td>Complete</td>
                  <td className="asset">{row.action}</td>
                  <td className="reserve-detail center-text">{row.amount}</td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
        <Button type="dashed" onClick={searchMoreLogs} className="centered">
          Load More
        </Button>
      </div>
      <Divider />
      <FooterLinks />
    </div>
  );
};
