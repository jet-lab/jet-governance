import { Divider, Tooltip, Button } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAirdrop } from "../contexts/airdrop";
import { InfoCircleFilled } from "@ant-design/icons";
import { useState } from "react";
import { FooterLinks } from "../components/FooterLinks";
import { RestakeModal } from "../components/modals/RestakeModal";

export const FlightLogView = () => {
  const [restakeModal, setRestakeModal] = useState(false);
  const { pendingTransactions, completeTransactions } = useAirdrop();
  const { connected } = useWallet();

  // Formatters for historical txns
  const formatDate = (date: Date) => {
    const padTo2Digits = (num: number) => {
      return num.toString().padStart(2, "0");
    };
    return [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join("-");
  };

  // Open explorer
  const explorerUrl = () =>
    window.open("https://explorer.solana.com", "_blank");

  return (
    <div className="view-container column-grid" id="flight-logs-view">
      <div className="neu-container" id="flight-log">
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
              {pendingTransactions.map((row) => (
                <tr>
                  <td className="italics">{formatDate(row.date)}</td>
                  <td className="italics">
                    {row.status}{" "}
                    <Tooltip
                      title="Unstaking transactions require a 29.5-day unbonding period. before withdrawal to your wallet is enabled. Status will show as 'unbonding' until this period completes."
                      mouseEnterDelay={0.1}
                    >
                      <InfoCircleFilled />
                    </Tooltip>
                    <RestakeModal
                      visible={restakeModal}
                      stakeAmount={row.amount}
                      onClose={() => setRestakeModal(false)}
                    />
                  </td>
                  <td className="italics">
                    <i className="italics"
                      onClick={explorerUrl}>{row.action}</i>{" "}
                    <Button type="dashed"
                      onClick={() => setRestakeModal(true)}>
                      Restake
                    </Button>
                  </td>
                  <td className="italics">{row.amount}</td>
                </tr>
              ))}
              <td colSpan={4}>
                <Divider />
              </td>
              {completeTransactions.map((row) => (
                <tr>
                  <td>{formatDate(row.date)}</td>
                  <td>{row.status}</td>
                  <td className="asset" onClick={explorerUrl}>
                    {row.action}
                  </td>
                  <td className="reserve-detail center-text">{row.amount}</td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
      <div className="spacer"/>
      <FooterLinks />
    </div>
  );
};
