import { useWallet } from "@solana/wallet-adapter-react";
import { useProposalContext } from "../contexts/proposal";
import { UnbondingLog } from "../components/unbonding/UnbondingLog";
import { useTransactionLogs } from "../contexts/transactionLogs";
import { Divider } from "antd";
import { Loader } from "../components/Loader";
import { useBlockExplorer } from "../contexts/blockExplorer";
import { ReactComponent as ArrowIcon } from "../images/arrow_icon.svg";

export const FlightLogView = () => {
  const { unbondingAccounts } = useProposalContext();
  const { loadingLogs, logs, searchMoreLogs, noMoreSignatures } = useTransactionLogs();
  const { connected } = useWallet();
  const { getExplorerUrl } = useBlockExplorer();

  return (
    <div className="view-container justify-start" id="flight-logs-view">
      <div className="neu-container centered" id="flight-log">
        <h1>Flight Logs</h1>
        <Divider />
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
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
              <td colSpan={4}>
                <Divider />
              </td>
            )}

            {/* Staking actions and completed unstaking actions */}
            {logs.map(row => (
              <tr onClick={() => window.open(getExplorerUrl(row.signature), "_blank")}>
                <td>{row.blockDate}</td>
                <td>Complete</td>
                <td className="asset">{row.action}</td>
                <td className="reserve-detail">{row.amount}</td>
                <td>
                  <ArrowIcon width="25px" />
                </td>
              </tr>
            ))}
            <tr className="no-interaction">
              <td></td>
              <td></td>
              <td className="load-more" style={{ padding: "10px 0 0 0" }}>
                {loadingLogs ? (
                  <Loader button />
                ) : (
                  <span
                    className={`text-gradient-btn ${
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
