import { InfoCircleFilled } from "@ant-design/icons";
import { bnToNumber, UnbondingAccount } from "@jet-lab/jet-engine";
import { Button, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { useProposalContext } from "../../contexts/proposal";
import { dateFromUnixTimestamp, toTokens } from "../../utils";
import { RestakeModal } from "../modals/RestakeModal";
import { WithdrawModal } from "../modals/WithdrawModal";

export const UnbondingLog = ({
  unbondingAccount
}: {
  unbondingAccount: UnbondingAccount | undefined;
}) => {
  const { jetMint } = useProposalContext();

  const [restakeModalVisible, setRestakeModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [canWithdraw, setCanWithdraw] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date().getTime() / 1000;
      const canWithdraw = time > bnToNumber(unbondingAccount?.unbondingAccount.unbondedAt);
      setCanWithdraw(canWithdraw);
    }, 4000);
    return () => {
      clearInterval(interval);
    };
  });

  return (
    <tr>
      <td className="italics">
        {dateFromUnixTimestamp(unbondingAccount?.unbondingAccount.unbondedAt)}
      </td>
      <td className="italics">
        Unbonding{" "}
        <Tooltip
          title="Unstaking transactions require a 29.5-day unbonding period. before withdrawal to your wallet is enabled. Status will show as 'unbonding' until this period completes."
          mouseEnterDelay={0.1}
        >
          <InfoCircleFilled />
        </Tooltip>
      </td>
      <td className="italics">
        <i className="italics">
          Unstake complete on {dateFromUnixTimestamp(unbondingAccount?.unbondingAccount.unbondedAt)}
        </i>{" "}
        <Button
          type="dashed"
          onClick={() =>
            canWithdraw ? setWithdrawModalVisible(true) : setRestakeModalVisible(true)
          }
        >
          {canWithdraw ? "Withdraw" : "Restake"}
        </Button>
        <RestakeModal
          visible={restakeModalVisible}
          onClose={() => setRestakeModalVisible(false)}
          unbondingAccount={unbondingAccount}
        />
        <WithdrawModal
          visible={withdrawModalVisible}
          onClose={() => setWithdrawModalVisible(false)}
          unbondingAccount={unbondingAccount}
        />
      </td>
      <td className="italics">
        -{toTokens(unbondingAccount?.unbondingAccount.amount.tokenAmount, jetMint)}
      </td>
    </tr>
  );
};
