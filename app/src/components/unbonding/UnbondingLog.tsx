import { InfoCircleFilled } from "@ant-design/icons";
import { UnbondingAccount } from "@jet-lab/jet-engine";
import { Button, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { useBlockExplorer, useProposalContext } from "../../contexts";
import { RestakeModal, WithdrawModal } from "../modals";
import { dateFromUnixTimestamp, toTokens } from "../../utils";

export const UnbondingLog = ({ unbondingAccount }: { unbondingAccount: UnbondingAccount }) => {
  const { jetMint } = useProposalContext();

  const [restakeModalVisible, setRestakeModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [isUnbonded, setIsUnbonded] = useState(false);
  const { getAccountExplorerUrl } = useBlockExplorer();

  useEffect(() => {
    const unbondedState = UnbondingAccount.isUnbonded(unbondingAccount);
    return setIsUnbonded(unbondedState);
  }, [setIsUnbonded, unbondingAccount]);

  return (
    <tr>
      <td
        className="italics"
        onClick={() =>
          unbondingAccount &&
          window.open(
            getAccountExplorerUrl(unbondingAccount.address.toBase58()),
            "_blank",
            "noreferrer"
          )
        }
      >
        {dateFromUnixTimestamp(unbondingAccount?.unbondingAccount.unbondedAt)}
      </td>
      <td
        className="italics"
        onClick={() =>
          unbondingAccount &&
          window.open(
            getAccountExplorerUrl(unbondingAccount.address.toBase58()),
            "_blank",
            "noreferrer"
          )
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
      <td className="action italics">
        <i className="italics">
          Unstake complete on {dateFromUnixTimestamp(unbondingAccount.unbondingAccount.unbondedAt)}
        </i>{" "}
        <Button
          size="small"
          type={isUnbonded ? undefined : "dashed"}
          className={isUnbonded ? "withdraw-btn" : "restake-btn"}
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
          unbondingAccount &&
          window.open(
            getAccountExplorerUrl(unbondingAccount.address.toBase58()),
            "_blank",
            "noreferrer"
          )
        }
      >
        {toTokens(unbondingAccount?.tokens, jetMint)}
      </td>
      <td>
        <i className="fas fa-external-link-alt"></i>
      </td>
    </tr>
  );
};
