import { useWallet } from "@solana/wallet-adapter-react";
import { FooterLinks } from "../components/FooterLinks";
import { useProposalContext } from "../contexts/proposal";
import { UnbondingLog } from "../components/unbonding/UnbondingLog";

export const FlightLogView = () => {
  const { unbondingAccounts } = useProposalContext();
  const { connected } = useWallet();

  // Open explorer
  const explorerUrl = () => window.open("https://explorer.solana.com", "_blank");

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
              {unbondingAccounts?.map(row => (
                <UnbondingLog key={row.address.toBase58()} unbondingAccount={row} />
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
