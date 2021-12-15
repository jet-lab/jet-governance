import { Table } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAirdrop } from "../contexts/airdrop";

export const FlightLogView = () => {
  const { connected, publicKey } = useWallet();
  const { transactionHistory } = useAirdrop();

  const dataSource = transactionHistory;
  
  console.log(transactionHistory);

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Status',
      dataIndex: 'age',
      key: 'age',
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
