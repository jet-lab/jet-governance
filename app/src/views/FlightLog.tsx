import { Divider, Tooltip } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAirdrop } from "../contexts/airdrop";
import { InfoCircleFilled } from "@ant-design/icons";
import React from "react";

export const FlightLogView = () => {
  const { pendingTransactions, completeTransactions } = useAirdrop();

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

  console.log(pendingTransactions);

  return (
    <div className="view-container" id="claim">
      <div className="neu-container">
        <h1>Flight logs</h1>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th className="center-text">Transaction</th>
              <th>Amount</th>
            </tr>
            <tr className="table-divider"></tr>
          </thead>

          <tbody>
            {pendingTransactions.map((row) => (
              <tr>
                <td className="italics">{formatDate(row.date)}</td>
                <td className="italics">
                  {row.status}{" "}
                  <Tooltip
                    title="Unstaking transactions require a 30-day unbonding period. Your transaction will be considered pending until the unbonding period completes."
                    mouseEnterDelay={0.1}
                  >
                    <InfoCircleFilled />
                  </Tooltip>
                </td>
                <td className="italics">{row.transaction}</td>
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
                <td className="asset">{row.transaction}</td>
                <td className="reserve-detail center-text">{row.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
