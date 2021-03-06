import { InfoCircleFilled } from "@ant-design/icons";
import { bnToNumber, UnbondingAccount } from "@jet-lab/jet-engine";
import { Button, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { useBlockExplorer, useProposalContext } from "../../contexts";
import { RestakeModal, WithdrawModal } from "../modals";
import { dateFromUnixTimestamp, getRemainingTime, toTokens } from "../../utils";
import { useCurrentTime } from "../../hooks";
import { ONE_DAY } from "../../constants";

export const UnbondingLog = ({ unbondingAccount }: { unbondingAccount: UnbondingAccount }) => {
  const { jetMint, stakePool } = useProposalContext();

  const [restakeModalVisible, setRestakeModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [isUnbonded, setIsUnbonded] = useState(false);
  const { getAccountExplorerUrl } = useBlockExplorer();

  const currentTime = useCurrentTime();
  const oneDayCountdown =
    !isUnbonded &&
    bnToNumber(unbondingAccount.unbondingAccount.unbondedAt) * 1000 - currentTime < ONE_DAY;

  const expired = bnToNumber(unbondingAccount.unbondingAccount.unbondedAt) * 1000 <= currentTime;

  useEffect(() => {
    const unbondedState = UnbondingAccount.isUnbonded(unbondingAccount);
    return setIsUnbonded(unbondedState);
  }, [setIsUnbonded, unbondingAccount, currentTime]);

  const getUnbondingAccountExplorerUrl = () => {
    unbondingAccount &&
      window.open(
        getAccountExplorerUrl(unbondingAccount.address.toBase58()),
        "_blank",
        "noreferrer"
      );
  };

  return (
    <tr>
      <td className="italics-text" onClick={getUnbondingAccountExplorerUrl}>
        {!!stakePool &&
          dateFromUnixTimestamp(
            unbondingAccount?.unbondingAccount.unbondedAt.sub(stakePool.stakePool.unbondPeriod)
          )}
      </td>
      <td className="italics-text tooltip" onClick={getUnbondingAccountExplorerUrl}>
        {isUnbonded ? "Unbonded" : "Unbonding"}
        {!isUnbonded && (
          <Tooltip
            title="Unstaking requires a 29.5-day unbonding period before withdrawal to your wallet is enabled. Status will show as 'Unbonding' until this period completes."
            mouseEnterDelay={0.1}
          >
            <InfoCircleFilled />
          </Tooltip>
        )}
      </td>

      <td className="action italics-text">
        <i onClick={getUnbondingAccountExplorerUrl}>
          Unstake complete{" "}
          {oneDayCountdown && !expired
            ? `in ${getRemainingTime(
                currentTime,
                bnToNumber(unbondingAccount.unbondingAccount.unbondedAt) * 1000
              )}`
            : `on 
            ${dateFromUnixTimestamp(unbondingAccount.unbondingAccount.unbondedAt)}`}
        </i>
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
        className="italics-text"
        onClick={() =>
          unbondingAccount &&
          window.open(
            getAccountExplorerUrl(unbondingAccount.address.toBase58()),
            "_blank",
            "noreferrer"
          )
        }
      >
        {toTokens(unbondingAccount.tokens, jetMint)}
      </td>
      <td onClick={getUnbondingAccountExplorerUrl}>
        <i className="fas fa-external-link-alt"></i>
      </td>
    </tr>
  );
};
