import { Airdrop } from "@jet-lab/jet-engine";
import { PublicKey } from "@solana/web3.js";
import { useState } from "react";
import { Button } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { ClaimModal } from "../modals";
import { useProposalContext } from "../../contexts";
import { fromLamports, getRemainingTime } from "../../utils";
import { useCurrentTime } from "../../hooks";

interface availAirdropsRender {
  airdrop: Airdrop;
  finalized: boolean;
  airdropAddress: PublicKey;
  shortDesc: string;
  longDesc: string;
  expireAt: number;
  amount: number | undefined;
}

export const Available = ({ airdropInfo }: { airdropInfo: availAirdropsRender }) => {
  const { airdrop, finalized, shortDesc, longDesc, expireAt, amount } = airdropInfo;
  const [showModal, setShowModal] = useState(false);
  const key = airdrop.airdropAddress.toString();
  const { jetMint } = useProposalContext();
  const currentTime = useCurrentTime();

  const claimed = amount === 0;
  const expired = expireAt * 1000 < currentTime;
  const airdropAmount = fromLamports(amount, jetMint);
  const replaceChars = (desc: string) => {
    return desc.replace(/â/g, "'").replace(/â/g, "-").replace(/â/g, "'");
  };

  return (
    <>
      {!expired && (
        <div className={`flex avail-list ${finalized ? "" : "announced"}`} key={key}>
          <span className="avail-info">
            <strong>
              {shortDesc} {airdropAmount === 0 ? "" : ` | ${airdropAmount} JET`}
            </strong>
            <br />
            {finalized ? replaceChars(longDesc) : "You'll just have to wait to find out!"}
            <br />
            <span className="gray">
              {finalized ? `Ends in ${getRemainingTime(currentTime, expireAt * 1000)}` : "?"}
            </span>
          </span>

          <Button
            type="primary"
            className="claim-button"
            onClick={() => setShowModal(true)}
            disabled={claimed || !finalized}
          >
            {claimed ? <CheckOutlined /> : "claim"}
          </Button>
          {showModal && (
            <ClaimModal
              stakeAmount={airdropAmount}
              airdrop={airdrop}
              onClose={() => setShowModal(false)}
            />
          )}
        </div>
      )}
    </>
  );
};
