import { useWallet } from "@solana/wallet-adapter-react";
import { useProposalContext } from "../contexts/proposal";
import { UnbondingLog } from "../components/unbonding/UnbondingLog";
import { useTransactionLogs } from "../contexts/transactionLogs";
import { Divider } from "antd";
import { Loader } from "../components/Loader";
import { useBlockExplorer } from "../contexts/blockExplorer";

export const FlightLogView = () => {
  const { unbondingAccounts } = useProposalContext();
  const { loadingLogs, logs, searchMoreLogs, noMoreSignatures } = useTransactionLogs();
  const { connected } = useWallet();
  const { getTxExplorerUrl } = useBlockExplorer();

  return (
    <div className="view-container justify-start" id="flight-logs-view">
      <div className="neu-container centered" id="flight-log">
        <h1>Flight Logs</h1>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th className="action">Action</th>
              <th>Amount</th>
              <th>{/* Empty column for arrow */}</th>
            </tr>
          </thead>

          <tbody>
            {/* Incomplete unstaking actions only */}

            {unbondingAccounts?.map(row => (
              <UnbondingLog key={row.address.toBase58()} unbondingAccount={row} />
            ))}

            {unbondingAccounts && unbondingAccounts?.length > 0 && logs.length > 0 && (
              <tr className="desktop">
                <td colSpan={5}>
                  <Divider />
                </td>
              </tr>
            )}

            {/* Staking actions and completed unstaking actions */}
            {logs.map(row => (
              <tr
                key={row.signature}
                onClick={() => window.open(getTxExplorerUrl(row.signature), "_blank")}
              >
                <td>{row.blockDate}</td>
                <td>Complete</td>
                <td className="action">{row.action}</td>
                <td>{row.amount}</td>
                <td>
                  <i className="fas fa-external-link-alt"></i>
                </td>
              </tr>
            ))}
            <tr className="no-interaction">
              <td></td>
              <td></td>
              <td className="action load-more" style={{ padding: "10px 0 0 0" }}>
                {loadingLogs ? (
                  <Loader button />
                ) : (
                  <span
                    className={`text-btn ${
                      !connected || loadingLogs || noMoreSignatures ? "disabled" : ""
                    }`}
                    onClick={() => {
                      if (connected && !(loadingLogs || noMoreSignatures)) {
                        searchMoreLogs();
                      }
                    }}
                  >
                    LOAD MORE
                  </span>
                )}
              </td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
