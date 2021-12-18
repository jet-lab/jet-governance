import { Divider, Table } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAirdrop } from "../contexts/airdrop";
import { InfoCircleOutlined } from "@ant-design/icons";

export const FlightLogView = () => {
  const { connected, publicKey } = useWallet();
  const { transactionHistory } = useAirdrop();

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

  const completedTx: {
    date: string;
    status: string;
    transaction: string;
    amount: string;
  }[] = [];

  const formatTransactionHistory = (tx: {
    date: Date;
    transaction: string;
    amount: number;
  }) => {
    completedTx.push({
      date: formatDate(tx.date),
      status: "Complete",
      transaction: formatDate(tx.date),
      amount: "+3750",
    });
  };

  for (let i = 0; i < transactionHistory.length; i++) {
    formatTransactionHistory(transactionHistory[i]);
  }

  const pendingTx: {
    date: string;
    status: string;
    transaction: string;
    amount: string;
  }[] = [];

  const formatPendingHistory = (tx: {
    date: Date;
    transaction: string;
    amount: number;
  }) => {
    pendingTx.push({
      date: formatDate(tx.date),
      status: "Pending",
      transaction: formatDate(tx.date),
      amount: "+3750",
    });
  };

  for (let i = 0; i < transactionHistory.length; i++) {
    formatPendingHistory(transactionHistory[i]);
  }

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Transaction",
      dataIndex: "transaction",
      key: "transaction",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
    },
  ];

  return (
    <div className="view-container" id="claim">
      <div className="panel">
        <h2>Flight Logs</h2>
        <div className="neu-container">
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
              {pendingTx.map((row) => (
                <>
                  <tr className="datatable-spacer">
                    <td>{/* Extra row for spacing */}</td>
                  </tr>
                  <tr>
                    <td className="italics">{row.date}</td>
                    <td className="italics">{row.status} <InfoCircleOutlined /></td>
                    <td className="italics">{row.transaction}</td>
                    <td className="italics">{row.amount}</td>
                  </tr>
                </>
              ))}
              <tr>
                <td colSpan={4}>
                  <Divider />
                </td>
              </tr>

              {completedTx.map((row) => (
                <>
                  <tr className="datatable-spacer">
                    <td>{/* Extra row for spacing */}</td>
                  </tr>
                  <tr>
                    <td>{row.date}</td>
                    <td>{row.status}</td>
                    <td className="asset">{row.transaction}</td>
                    <td className="reserve-detail center-text">{row.amount}</td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
