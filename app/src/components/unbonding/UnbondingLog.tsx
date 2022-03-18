import { InfoCircleFilled } from "@ant-design/icons";
import { UnbondingAccount } from "@jet-lab/jet-engine";
import { Button, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { useProposalContext } from "../../contexts/proposal";
import { dateFromUnixTimestamp, openExplorer, toTokens } from "../../utils";
import { RestakeModal } from "../modals/RestakeModal";
import { WithdrawModal } from "../modals/WithdrawModal";

export const UnbondingLog = ({ unbondingAccount }: { unbondingAccount: UnbondingAccount }) => {
  const { jetMint } = useProposalContext();

  const [restakeModalVisible, setRestakeModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [isUnbonded, setIsUnbonded] = useState(false);

  useEffect(() => {
    const unbondedState = UnbondingAccount.isUnbonded(unbondingAccount);
    return setIsUnbonded(unbondedState);
  }, [setIsUnbonded, unbondingAccount]);

  return (
    <tr>
      <td
        className="italics"
        onClick={() =>
          unbondingAccount && openExplorer(unbondingAccount.address.toBase58(), "account")
        }
      >
        {dateFromUnixTimestamp(unbondingAccount?.unbondingAccount.unbondedAt)}
      </td>
      <td
        className="italics"
        onClick={() =>
          unbondingAccount && openExplorer(unbondingAccount.address.toBase58(), "account")
        }
      >
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
          Unstake complete on {dateFromUnixTimestamp(unbondingAccount.unbondingAccount.unbondedAt)}
        </i>{" "}
        <Button
          type="dashed"
          onClick={() =>
            isUnbonded ? setWithdrawModalVisible(true) : setRestakeModalVisible(true)
          }
        >
          {isUnbonded ? "Withdraw" : "Restake"}
        </Button>
        {restakeModalVisible && (
          <RestakeModal
            onClose={() => setRestakeModalVisible(false)}
            unbondingAccount={unbondingAccount}
          />
        )}
        {withdrawModalVisible && (
          <WithdrawModal
            onClose={() => setWithdrawModalVisible(false)}
            unbondingAccount={unbondingAccount}
          />
        )}
      </td>
      <td
        className="italics"
        onClick={() =>
          unbondingAccount && openExplorer(unbondingAccount.address.toBase58(), "account")
        }
      >
        -{toTokens(unbondingAccount?.unbondingAccount.amount.tokenAmount, jetMint)}
      </td>
    </tr>
  );
};
