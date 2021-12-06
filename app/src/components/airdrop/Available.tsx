import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "antd";
import { CheckOutlined } from "@ant-design/icons"

export const Available = (props: any) => {
  const { name, amount, end, claimed } = props;
  const { connected, wallet, publicKey, disconnect } = useWallet();

  return (
    <div className="flex justify-between align-center">
      <span>{name} | {amount} JET Info about airdrop info, etc. Available for
      each user. Ends in {end.getDate()}</span>
      <Button type="primary" className={claimed ? "disabled" : ""}>{claimed ? (<CheckOutlined />) : "claim"}</Button>
    </div>
  );
};
