import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "antd";

export const Available = (props: any) => {
  const { name, amount, end, claimed } = props;
  const { connected, wallet, publicKey, disconnect } = useWallet();

  return (
    <div className="flex">
      <span>{name} | {amount} JET Info about airdrop info, etc. Available for
      each user. Ends in {end.getDate()}</span>
      <Button>hi!</Button>
    </div>
  );
};
