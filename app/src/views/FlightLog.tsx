import { Table } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAirdrop } from "../contexts/airdrop";

export const FlightLogView = () => {
  const { connected, publicKey } = useWallet();
  const { transactionHistory } = useAirdrop();

  const pendingTxns = () => {
    
  }

  // Formatters for historical txns
  const formatDate = (date: Date) => {
    const padTo2Digits = (num: number) => {
      return num.toString().padStart(2, "0")
    }
    return [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate())
    ].join("-");
  }

  const dataSource: {
    date: string,
    status: string,
    transaction: string,
    amount: string
  }[] = [];
  const formatTransactionHistory = (tx: {
    date: Date;
    transaction: string;
    amount: number;
}) => {
  dataSource.push({
      date: formatDate(tx.date),
      status: "Complete",
      transaction: formatDate(tx.date),
      amount: "+3750"
    });
  }

  for (let i = 0; i < transactionHistory.length; i++) {
    formatTransactionHistory(transactionHistory[i])
  }

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Transaction',
      dataIndex: 'transaction',
      key: 'transaction',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
    },
  ];

  return (
    <div className="view-container" id="claim">
      <div className="panel">
        <h2>Flight Logs</h2>
        <div className="neu-container">
        <Table dataSource={dataSource} columns={columns} />
        </div>
      </div>

      
    </div>
  );
};
